const  fs =  require('node:fs/promises');


async function main() {
   const scanResults =  await fs.readFile(`${__dirname}/scan_results.json`, { encoding: 'utf-8' });
   const results = JSON.parse(scanResults);
   const summary = new Map();

   for (const [key, value] of Object.entries(results)) {
        value.forEach((r,index) => {
            if (r.id !== 'none') {                
                r.licenses.forEach((l)=>{
                    if (l.copyleft === 'yes') {
                        if(!summary.has(key)) {
                          summary.set(`${r.purl[0]}@${r.version}`,{  copyleft:1 , licenses: new Set().add(l.name) });
                        } 
                        else {
                          const component = summary.get(`${r.purl[0]}@${r.version}`);
                          component.copyleft = component.copyleft + 1;
                          component.licenses.add(l.name);
                        }
                    }
                });
            }
        });
  }


   summary.forEach((r)=>{
       r.licenses = Array.from(r.licenses.values());
   });

  const csv = getCSV(summary);
  await fs.writeFile(`${__dirname}/data.csv`,csv, { encoding: 'utf-8' });
  await fs.writeFile(`${__dirname}/summary.json`,JSON.stringify(Object.fromEntries(summary),null,2), { encoding: 'utf-8' });
  let components = Array.from(summary.values());
  if (components.length > 0) process.exit(3);
  process.exit(0);
}

function getCSV(summary){
    let csv = 'component,name,copyleft\n';
    summary.forEach((value, key) => {
       csv += `${key},1,${value.copyleft}\n`;
    });
    return csv;
}


main();
