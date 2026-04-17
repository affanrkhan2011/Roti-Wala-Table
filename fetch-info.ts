import https from 'https';

https.get('https://rotiwala.ca/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const logos = data.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    console.log('Images:', logos?.filter(l => l.toLowerCase().includes('logo')));
    
    const addressMatch = data.match(/<[^>]+>([^<]*Vancouver[^<]*)<\/[^>]+>/gi);
    console.log('Address matches:', addressMatch);
    
    const phoneMatch = data.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    console.log('Phone matches:', phoneMatch);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
