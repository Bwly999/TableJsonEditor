import { FlatRow } from '../types';
import { unflattenJSON } from './jsonHelper';

export const buildJsonExportData = (originalJson: any, fullFlatRows: FlatRow[]) => {
  return unflattenJSON(originalJson, fullFlatRows);
};

export const getExcelExportRows = (fullFlatRows: FlatRow[]) => {
  return fullFlatRows;
};
