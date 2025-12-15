export type Primitive = string | number | boolean | null;

export interface FlatRow {
  _id: string; // Unique identifier for the row (usually derived from path)
  _path: (string | number)[]; // Path to the leaf object in the original JSON
  _propPaths: Record<string, (string | number)[]>; // Map of column key -> full path to value in original JSON
  _propPathIds: Record<string, string>; // Map of column key -> stringified path (for fast comparison)
  [key: string]: any; // Dynamic columns
}

export interface ColumnMeta {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'null' | 'mixed';
  originalKey: string; // The key name in the leaf object
  isParent: boolean; // True if this column comes from a parent object
}

export interface FilterState {
  [columnKey: string]: Set<Primitive>;
}

export interface JsonNode {
  [key: string]: any;
}