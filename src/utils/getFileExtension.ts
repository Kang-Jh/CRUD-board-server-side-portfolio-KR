/**
 * if file name is example.html then this method return html without period
 * @param filename - filename with string
 * @return return extension without period
 */
export function getFileExtension(filename: string) {
  const lastIndexOfPeriod = filename.lastIndexOf('.');
  const fileExtension =
    lastIndexOfPeriod !== -1 ? filename.slice(lastIndexOfPeriod + 1) : '';

  return fileExtension;
}
