export type FileOrDir = {
  name: string;
  type: 'file' | 'dir';
  size: number;
  contents?: FileOrDir[];
};
