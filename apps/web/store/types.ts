export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface DesignMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string | null;
  deletedAt: string | null;
}
