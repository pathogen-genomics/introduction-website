import json
import requests
from typing import Dict, List

def get_custom_country_name(original_name: str) -> str:
    """Apply custom name mappings for specific countries"""
    name_mappings = {
        "Gambia": "The Gambia",
        "United Republic of Tanzania": "Tanzania",
        "Palestine": "Palestinian Territory",
        # Add more custom mappings here as needed
        # "Original Name": "Preferred Name",
    }
    
    return name_mappings.get(original_name, original_name)

def get_countries_with_polygons():
    """Get countries with actual polygon geometries"""
    # Using Natural Earth Data via a different approach
    # We'll use a simplified world countries GeoJSON
    
    # URL for a simplified world countries GeoJSON
    url = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        countries_data = response.json()
        
        # Transform the data to match our format
        transformed_features = []
        for feature in countries_data["features"]:
            # Skip if no geometry
            if not feature.get("geometry"):
                continue
                
            properties = feature.get("properties", {})
            
            # Get the country name, trying different possible property names
            country_name = (properties.get("ADMIN") or 
                          properties.get("NAME") or 
                          properties.get("name") or
                          "Unknown")
            
            # Apply custom name mapping
            country_name = get_custom_country_name(country_name)
            
            transformed_features.append({
                "type": "Feature",
                "properties": {
                    "name": country_name,
                    "admin": country_name,
                    "iso_a2": properties.get("ISO_A2", "") or properties.get("iso_a2", ""),
                    "iso_a3": properties.get("ISO_A3", "") or properties.get("iso_a3", ""),
                    "type": "country"
                },
                "geometry": feature["geometry"]
            })
        
        return transformed_features
        
    except requests.RequestException as e:
        print(f"Error fetching countries with polygons: {e}")
        return []

def create_combined_geojson(us_states_file: str, output_file: str):
    """Combine US states with world countries"""
    
    # Read US states GeoJSON
    try:
        with open(us_states_file, 'r') as f:
            us_states_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {us_states_file}")
        return
    except json.JSONDecodeError as e:
        print(f"Error reading US states file: {e}")
        return
    
    # Get countries data with polygons
    countries_data = get_countries_with_polygons()
    
    # Filter out US from countries (since we have US states)
    countries_data = [country for country in countries_data 
                     if country["properties"]["iso_a2"] != "US"]
    
    # Combine US states and countries
    combined_features = us_states_data["features"] + countries_data
    
    # Create new GeoJSON structure
    combined_geojson = {
        "type": "FeatureCollection",
        "features": combined_features
    }
    
    # Write to output file
    try:
        with open(output_file, 'w') as f:
            json.dump(combined_geojson, f, indent=2)
        print(f"Successfully created {output_file}")
        print(f"Total features: {len(combined_features)}")
        print(f"US states: {len(us_states_data['features'])}")
        print(f"Countries: {len(countries_data)}")
        
        # Print a few examples to verify names are included
        print("\nExample country entries:")
        for i, feature in enumerate(countries_data[:3]):
            print(f"  {feature['properties']['name']} ({feature['properties']['iso_a3']})")
        
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    us_states_file = "us-states.geo.json"
    output_file = "us-states-and-countries.geo.json"
    create_combined_geojson(us_states_file, output_file) 