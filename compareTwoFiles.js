import fs from "promise-fs";

const main = async () => {
  const fileA = 'output';
  const fileB = 'sample';

  const bufA = await fs.readFile(fileA);
  const bufB = await fs.readFile(fileB);

  if (bufA.length !== bufB.length) {
    console.error('Their lengths are different!');
    return;
  }

  for (let i = 0; i < bufA.length; i ++) {
    if (bufA[i] !== bufB[i]) {
      console.error(`We found the difference in ${i}th!`);
      return;
    }
  }
  
  console.log('They are same!');
}

main();