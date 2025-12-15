import { FlatRow, ColumnMeta, Primitive } from '../types';

interface FlattenContext {
  values: Record<string, any>;
  propPaths: Record<string, (string | number)[]>;
  propPathIds: Record<string, string>;
}

/**
 * Flattens the JSON into rows based on the deepest nested array found.
 * Captures the exact path for every property to allow precise updates.
 */
export const flattenJSON = (json: any): { rows: FlatRow[]; columns: ColumnMeta[] } => {
  const rows: FlatRow[] = [];
  const columnSet = new Map<string, ColumnMeta>();

  if (!json) return { rows: [], columns: [] };

  const getPathId = (path: (string | number)[]) => path.join('.');

  // Recursive function to traverse and collect rows
  const traverse = (
    node: any,
    path: (string | number)[],
    context: FlattenContext
  ) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
         traverse(node[i], [...path, i], context); 
      }
      return;
    }

    if (typeof node === 'object' && node !== null) {
      let hasChildArray = false;
      
      // Clone context for this level
      const currentContext: FlattenContext = {
        values: { ...context.values },
        propPaths: { ...context.propPaths },
        propPathIds: { ...context.propPathIds }
      };
      
      const keys = Object.keys(node);
      const primitiveKeys: string[] = [];
      const arrayKeys: string[] = [];

      for (const key of keys) {
          const value = node[key];
          if (Array.isArray(value)) {
              arrayKeys.push(key);
              hasChildArray = true;
          } else if (typeof value !== 'object' || value === null) {
              primitiveKeys.push(key);
          }
      }

      // Process primitives: Update context values and paths
      for (const key of primitiveKeys) {
          const value = node[key];
          const fullPath = [...path, key];
          
          currentContext.values[key] = value;
          currentContext.propPaths[key] = fullPath;
          currentContext.propPathIds[key] = getPathId(fullPath);
          
          const type = getTypeOf(value);
          let col = columnSet.get(key);

          if (!col) {
              columnSet.set(key, { key, originalKey: key, type, isParent: true });
          } else if (col.isParent) {
               // If we found this key before as a parent, but now we see it again (maybe deeper or same level),
               // we update type if needed.
              if (col.type === 'null' && type !== 'null') {
                  col.type = type;
              }
          }
      }

      // Traverse children
      for (const key of arrayKeys) {
          traverse(node[key], [...path, key], currentContext);
      }

      // If no child arrays, this is a leaf node (a row)
      if (!hasChildArray) {
        const row: FlatRow = {
          _id: path.join('.'),
          _path: path,
          _propPaths: currentContext.propPaths,
          _propPathIds: currentContext.propPathIds,
          ...currentContext.values,
        };
        
        // Update column definitions for leaf properties
        for (const key of primitiveKeys) {
             const value = node[key];
             const type = getTypeOf(value);
             let col = columnSet.get(key);
             
             if (!col) {
                 columnSet.set(key, { key, originalKey: key, type, isParent: false });
             } else {
                 // If a column exists and we are at a leaf, it is technically 'local' to this row in this branch.
                 // We mark it as NOT isParent (though we will allow editing regardless now).
                 // The concept of isParent is less strict now that we support editing everything.
                 // We keeps isParent=true only if it NEVER appears at the leaf level across the dataset,
                 // or strictly based on this traversal logic. 
                 // For visual consistency, we update it here.
                 if (col.isParent) {
                     col.isParent = false;
                 }
                 if (col.type === 'null' && type !== 'null') {
                     col.type = type;
                 }
             }
        }
        
        rows.push(row);
      }
    }
  };

  traverse(json, [], { values: {}, propPaths: {}, propPathIds: {} });

  const columns = Array.from(columnSet.values()).sort((a, b) => {
    if (a.isParent === b.isParent) return 0;
    return a.isParent ? -1 : 1; 
  });

  return { rows, columns };
};

const getTypeOf = (val: any): ColumnMeta['type'] => {
  if (val === null) return 'null';
  return typeof val as ColumnMeta['type'];
};

/**
 * Updates the original JSON using the exact property paths stored in rows.
 * This supports updating parent properties correctly.
 */
export const unflattenJSON = (originalJson: any, rows: FlatRow[]): any => {
  const newJson = JSON.parse(JSON.stringify(originalJson));

  const setVal = (obj: any, path: (string | number)[], value: any) => {
      let current = obj;
      for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (current[key] === undefined) return; // Should not happen if structure matches
          current = current[key];
      }
      const lastKey = path[path.length - 1];
      if (current && typeof current === 'object') {
          current[lastKey] = value;
      }
  };

  for (const row of rows) {
      // We iterate all columns present in the row's property paths
      for (const key in row._propPaths) {
          const fullPath = row._propPaths[key];
          const value = row[key];
          
          // We set the value at the specific path. 
          // Note: If multiple rows share the same path (parent prop), 
          // they will just overwrite each other with the same value (since we sync them in UI), which is fine.
          setVal(newJson, fullPath, value);
      }
  }

  return newJson;
};

/**
 * Smartly parses input string into JSON primitive types.
 * "true" -> true
 * "123" -> 123
 * "null" -> null
 * everything else -> string
 */
export const smartParseValue = (input: string): Primitive => {
  if (input === undefined) return null;
  if (input === null) return null;

  const trimmed = input.trim();

  // Null check
  if (trimmed.toLowerCase() === 'null') return null;
  if (trimmed === '') return null; // Treat empty string as null/empty? Or empty string? Let's treat completely empty as null for consistency with deleting.

  // Boolean check
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  // Number check
  // We use Number() but strictly check against empty string again because Number('') is 0
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  // Fallback to string
  return input;
};