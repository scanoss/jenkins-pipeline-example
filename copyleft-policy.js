const  fs =  require('node:fs/promises');


async function main() {
  console.log(__dirname);
   const scanResults =  await fs.readFile(`${__dirname}/scan_results.json`, { encoding: 'utf-8' });
   const results = JSON.parse(scanResults);
   const filesWithCopyLeft = new Set();
   const summary = new Map();

   for (const [key, value] of Object.entries(results)) {
        value.forEach((r,index) => {
            if (r.id !== 'none') {                
                r.licenses.forEach((l)=>{
                    if (l.copyleft === 'yes') {
                        if(!summary.has(key)) {
                          summary.set(key,{ components: 1 , copyleft:1  });
                        } 
                        else {
                          summary.get(key).copyleft = summary.get(key).copyleft + 1; 
                        }
                    }
                });
            }
        });
  }

  const csv = getCSV(summary);
  console.log(csv);
  await fs.writeFile(`${__dirname}/data.csv`,csv, { encoding: 'utf-8' });
  let files = Array.from(filesWithCopyLeft);
  if (files.length > 0) process.exit(3);
  process.exit(0);
}

function getCSV(summary){
    let csv = 'file,components,copyleft\n';
    summary.forEach((value, key) => {
        console.log(key);
        console.log(value);
       csv += `${key},${value.components},${value.copyleft}\n`;
    });
    return csv;
}


main();
