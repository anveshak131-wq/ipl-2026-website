// Script to setup sample grounds data in KV
const sampleGrounds = [
  {
    id: 'wankhede-stadium',
    name: 'Wankhede Stadium, Mumbai',
    lat: 19.0,
    lng: 72.9,
    city: 'Mumbai',
    capacity: 33000
  },
  {
    id: 'chinnaswamy-stadium',
    name: 'M. Chinnaswamy Stadium, Bangalore',
    lat: 12.9,
    lng: 77.6,
    city: 'Bangalore',
    capacity: 38000
  },
  {
    id: 'eden-gardens',
    name: 'Eden Gardens, Kolkata',
    lat: 22.6,
    lng: 88.4,
    city: 'Kolkata',
    capacity: 66000
  },
  {
    id: 'chepauk-stadium',
    name: 'M.A. Chidambaram Stadium, Chennai',
    lat: 13.1,
    lng: 80.3,
    city: 'Chennai',
    capacity: 50000
  },
  {
    id: 'arun-jaitley-stadium',
    name: 'Arun Jaitley Stadium, Delhi',
    lat: 28.6,
    lng: 77.2,
    city: 'Delhi',
    capacity: 55000
  }
];

// This script can be run to populate KV with grounds data
// Run with: wrangler kv:key put --binding=SPORTS_KV "grounds:list" --path=grounds.json

console.log('Sample grounds data:');
console.log(JSON.stringify(sampleGrounds, null, 2));

// Create grounds.json file for import
import { writeFileSync } from 'node:fs';
writeFileSync('grounds.json', JSON.stringify(sampleGrounds, null, 2));
console.log('Created grounds.json for KV import');
