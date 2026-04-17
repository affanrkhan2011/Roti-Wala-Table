import https from 'node:https';

https.get('https://rotiwala.ca/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/<img[^>]+src="([^">]+)"/gi);
    if (matches) {
      console.log(matches.filter(m => m.toLowerCase().includes('logo')));
    } else {
      console.log('No images found');
    }
  });
}).on('error', err => console.log('Error: ', err.message));
