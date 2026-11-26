import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getGeoHierarchy, 
  saveGeoHierarchy, 
  getMasterHeads, 
  saveMasterHeads 
} from './storage.ts';
import { 
  mergeGeoHierarchy, 
  getProvincesForCountry, 
  getDivisionsForProvince, 
  getDistrictsForDivision, 
  getTehsilsForDistrict,
  CountryInfo 
} from './pakistanGeo.ts';
import { MasterHeadsConfig } from '../types/index.ts';

test('Open Heads: Dynamic Country (Malavi) addition & cascading 5-tier structure', () => {
  const currentHierarchy = getGeoHierarchy();

  // Create new country Malavi with starter structure
  const malaviCountry: CountryInfo = {
    name: 'Malavi',
    nameUrdu: 'ملاوی',
    flag: '🇲🇼',
    code: 'MW',
    provinces: [
      {
        name: 'Central Region',
        nameUrdu: 'مرکزی خطہ',
        divisions: [
          {
            name: 'Lilongwe Division',
            nameUrdu: 'لیلونگوے ڈویژن',
            districts: [
              {
                name: 'Lilongwe District',
                nameUrdu: 'لیلونگوے ضلع',
                tehsils: ['Lilongwe City', 'Dedza', 'Dowa']
              }
            ]
          }
        ]
      }
    ]
  };

  const updatedHierarchy = [...currentHierarchy.filter(c => c.name !== 'Malavi'), malaviCountry];
  saveGeoHierarchy(updatedHierarchy);

  const savedHierarchy = getGeoHierarchy();
  const foundMalavi = savedHierarchy.find(c => c.name.toLowerCase() === 'malavi');
  assert.ok(foundMalavi, 'Malavi must be present in saved geo hierarchy');
  assert.equal(foundMalavi.nameUrdu, 'ملاوی');
  assert.equal(foundMalavi.provinces.length, 1);

  // Cascading helpers with dynamic customHierarchy
  const provinces = getProvincesForCountry('Malavi', savedHierarchy);
  assert.equal(provinces.length, 1);
  assert.equal(provinces[0].name, 'Central Region');

  const divisions = getDivisionsForProvince('Malavi', 'Central Region', savedHierarchy);
  assert.equal(divisions.length, 1);
  assert.equal(divisions[0].name, 'Lilongwe Division');

  const districts = getDistrictsForDivision('Malavi', 'Central Region', 'Lilongwe Division', savedHierarchy);
  assert.equal(districts.length, 1);
  assert.equal(districts[0].name, 'Lilongwe District');

  const tehsils = getTehsilsForDistrict('Malavi', 'Central Region', 'Lilongwe District', savedHierarchy);
  assert.deepEqual(tehsils, ['Lilongwe City', 'Dedza', 'Dowa']);
});

test('Open Heads: Empty country automatically receives starter cascading structure', () => {
  const currentHierarchy = getGeoHierarchy();
  const turkeyCountry: CountryInfo = {
    name: 'Turkey',
    nameUrdu: 'ترکی',
    flag: '🇹🇷',
    code: 'TR',
    provinces: [] // empty
  };

  const updated = [...currentHierarchy.filter(c => c.name !== 'Turkey'), turkeyCountry];
  saveGeoHierarchy(updated);

  const reloaded = getGeoHierarchy();
  const found = reloaded.find(c => c.name === 'Turkey');
  assert.ok(found, 'Turkey must exist in hierarchy');
  assert.ok(found.provinces.length > 0, 'Empty country must receive safe starter province');
  assert.ok(found.provinces[0].divisions.length > 0, 'Starter province must have starter division');
  assert.ok(found.provinces[0].divisions[0].districts.length > 0, 'Starter division must have starter district');
  assert.ok(found.provinces[0].divisions[0].districts[0].tehsils.length > 0, 'Starter district must have starter tehsil');
});

test('Open Heads: mergeGeoHierarchy preserves newly added country during cloud sync', () => {
  const localHierarchy = getGeoHierarchy();
  // Ensure local has Malavi
  assert.ok(localHierarchy.some(c => c.name.toLowerCase() === 'malavi'));

  // Remote hierarchy without Malavi (e.g. from an older cloud backup)
  const remoteHierarchy = localHierarchy.filter(c => c.name.toLowerCase() !== 'malavi');

  // Merging local with remote must NOT lose Malavi
  const merged = mergeGeoHierarchy(localHierarchy, remoteHierarchy);
  assert.ok(merged.some(c => c.name.toLowerCase() === 'malavi'), 'Local addition of Malavi must survive cloud merge');
});

test('Open Heads: Master Heads dynamic categories, conditions & questions updates', () => {
  const heads = getMasterHeads();
  const testCat = 'Solar Submersible RO Plant';
  
  const updatedHeads: MasterHeadsConfig = {
    ...heads,
    categories: Array.from(new Set([...heads.categories, testCat])),
  };

  saveMasterHeads(updatedHeads);
  const reloadedHeads = getMasterHeads();
  assert.ok(reloadedHeads.categories.includes(testCat), 'New category must be persisted in Master Heads');
});
