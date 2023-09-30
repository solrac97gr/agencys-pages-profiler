import fs from "fs";

export function createOutFolderIfNotExist() {
  const folderPath = "out"; // Specify the folder path you want to create

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Folder '${folderPath}' created successfully.`);
  } else {
    console.log(`Folder '${folderPath}' already exists.`);
  }
}
