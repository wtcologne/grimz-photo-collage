export type CollageFormat = '3x1' | '2x1';

export interface CollageLayout {
  format: CollageFormat;
  name: string;
  description: string;
  rows: number;
  cols: number;
  aspectRatio: number;
  icon: string;
}

export interface CollageSlice {
  row: number;
  col: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export const COLLAGE_LAYOUTS: Record<CollageFormat, CollageLayout> = {
  '3x1': {
    format: '3x1',
    name: '3 Streifen',
    description: '3 horizontale Streifen',
    rows: 3,
    cols: 1,
    aspectRatio: 3/4,
    icon: '▬▬▬'
  },
  '2x1': {
    format: '2x1',
    name: '2 Streifen',
    description: '2 horizontale Streifen',
    rows: 2,
    cols: 1,
    aspectRatio: 2/3,
    icon: '▬▬'
  }
};

export function getCollageSlices(format: CollageFormat, width: number, height: number): CollageSlice[] {
  const layout = COLLAGE_LAYOUTS[format];
  const slices: CollageSlice[] = [];
  
  const sliceWidth = width / layout.cols;
  const sliceHeight = height / layout.rows;
  
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      slices.push({
        row,
        col,
        width: sliceWidth,
        height: sliceHeight,
        x: col * sliceWidth,
        y: row * sliceHeight
      });
    }
  }
  
  return slices;
}
