
import json

def get_feature(d):
    feature = {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [d['geo'][0], d['geo'][1]]}}
    feature['properties'] = {'title': d['title'], 'country': d['country'], 'location_id': d['id'], 'lng': d['geo'][0], 'lat': d['geo'][1]}
    return feature

# Download a fresh copy of the data from radio.garden with
# curl https://radio.garden/api/ara/content/places > radio.garden.locations.json
# 
# Save the output from this script to geo_json.min.json and replace the one in
# the public/assets/js directory

# open the radio.garden json
with open("radio.garden.locations.json") as FP:
    rg_json = json.load(FP)

geo_json = {'type': 'FeatureCollection', 'features': []}

for item in rg_json['data']['list']:
    geo_json['features'].append(get_feature(item))

print(json.dumps(geo_json))
