from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import pandas as pd
import time
import re
from typing import Dict
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LocationStandardizer:
    def __init__(self, max_retries=3, initial_wait=2):
        self.geolocator = Nominatim(user_agent="tb_location_standardizer")
        self.max_retries = max_retries
        self.initial_wait = initial_wait
        
        # US state mapping
        self.us_state_dict = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming'
        }
        
        # Country name mappings
        self.country_name_mapping = {
            'Russian Federation': 'Russia',
            'United States of America': 'United States',
            'The Netherlands': 'Netherlands',
            'República Argentina': 'Argentina',
            'Brasil': 'Brazil',
            'México': 'Mexico',
            'España': 'Spain',
            'Deutschland': 'Germany',
            'Sverige': 'Sweden',
            'Italia': 'Italy',
            'România': 'Romania',
            'Česká republika': 'Czech Republic',
            'Россия': 'Russia',
            '中国': 'China',
            '日本': 'Japan',
            'भारत': 'India'
        }

        # Custom location mappings for edge cases
        self.custom_location_mapping = {
            'Worchester, MA': 'Worcester, Massachusetts, United States',
            'Zheijiang': 'Zhejiang, China',
            'Northeastern Spain': 'Catalonia, Spain',
            'Chugoku-Shikoku': 'Chugoku, Japan',
            'Sudan/Horn of Africa': 'Sudan',
            'Petersburgh, NY (Evergreen Farm)': 'Petersburg, New York, United States',
            'Rutland, VT (Harvey Farms)': 'Rutland, Vermont, United States',
            'Tamil Nadu - Keelakunupatti': 'Tamil Nadu, India',
            'Durban Chest Clinic': 'Durban, KwaZulu-Natal, South Africa',
            'King George V Hospital, Durban': 'Durban, KwaZulu-Natal, South Africa',
            'Damien Foundation Project area': 'Bangladesh',
            'Torres Strait Protected Zone': 'Torres Strait Islands, Queensland, Australia',
            'Point G Hospital': 'Bamako, Mali',
            'East Greenland': 'Sermersooq, Greenland',
            'Eastern China': 'Shanghai, China',
            'Greater Florianopolis': 'Florianópolis, Santa Catarina, Brazil',
        }

        # Region/State standardization mappings
        self.region_standardization = {
            'KwaZulu-Natal': 'KwaZulu-Natal, South Africa',
            'Western Cape': 'Western Cape, South Africa',
            'British Columbia': 'British Columbia, Canada',
            'New South Wales': 'New South Wales, Australia',
            'Northern Territory': 'Northern Territory, Australia',
            'Tamil Nadu': 'Tamil Nadu, India',
            'Uttar Pradesh': 'Uttar Pradesh, India',
            'Madhya Pradesh': 'Madhya Pradesh, India',
        }

    def standardize_country_name(self, country: str) -> str:
        return self.country_name_mapping.get(country, country)

    def preprocess_location(self, location: str) -> str:
        location = location.strip()
        
        # Check custom mappings first
        if location in self.custom_location_mapping:
            return self.custom_location_mapping[location]
        
        # Check region standardization
        if location in self.region_standardization:
            return self.region_standardization[location]
        
        # Handle parentheses
        location = re.sub(r'\s*\([^)]*\)', '', location)
        
        # Handle hyphenated locations
        if ' - ' in location:
            parts = location.split(' - ')
            if len(parts[1].split()) <= 2:
                location = parts[0]
        
        # Handle forward slashes
        if '/' in location:
            location = location.split('/')[0]
        
        # Handle specific facilities
        if any(facility in location.lower() for facility in ['hospital', 'clinic', 'foundation']):
            city_match = re.search(r'([^,]+),\s*([^,]+)', location)
            if city_match:
                location = f"{city_match.group(1)}, {city_match.group(2)}"
        
        # US state handling
        if location in self.us_state_dict:
            return f"{self.us_state_dict[location]}, United States"
        
        city_state_match = re.match(r"(.*?),\s*([A-Z]{2})$", location)
        if city_state_match:
            city, state_abbrev = city_state_match.groups()
            if state_abbrev in self.us_state_dict:
                return f"{city}, {self.us_state_dict[state_abbrev]}, United States"
        
        return location

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry_error_callback=lambda retry_state: {
            'original': retry_state.args[0],
            'state_province': 'Error: Max retries exceeded',
            'country': 'Error: Connection failed'
        }
    )
    def geocode_with_retry(self, location: str) -> Dict[str, str]:
        processed_location = self.preprocess_location(location)
        
        try:
            location_info = self.geolocator.geocode(
                processed_location,
                addressdetails=True,
                language='en',
                timeout=10
            )
            
            if location_info is None:
                return {
                    'original': location,
                    'state_province': 'Not found',
                    'country': 'Not found'
                }
            
            address = location_info.raw.get('address', {})
            
            state_province = (
                address.get('state') or
                address.get('province') or
                address.get('region') or
                address.get('state_district') or
                'Not available'
            )
            
            country = self.standardize_country_name(address.get('country', 'Not available'))
            
            # Handle non-English names
            if state_province != 'Not available' and any(ord(c) > 127 for c in state_province):
                try:
                    state_location = self.geolocator.geocode(
                        f"{state_province}, {country}",
                        language='en',
                        addressdetails=True,
                        timeout=10
                    )
                    if state_location:
                        state_address = state_location.raw.get('address', {})
                        english_state = (
                            state_address.get('state') or
                            state_address.get('province') or
                            state_address.get('region') or
                            state_province
                        )
                        state_province = english_state
                except Exception as e:
                    logger.warning(f"Failed to get English name for {state_province}: {str(e)}")
            
            return {
                'original': location,
                'state_province': state_province,
                'country': country
            }
            
        except Exception as e:
            logger.error(f"Error geocoding {location}: {str(e)}")
            raise

    def geocode_location(self, location: str) -> Dict[str, str]:
        try:
            # Check if location is in custom mapping first
            if location in self.custom_location_mapping:
                mapped_location = self.custom_location_mapping[location]
                parts = mapped_location.split(', ')
                if len(parts) >= 2:
                    return {
                        'original': location,
                        'state_province': parts[1] if len(parts) > 2 else parts[0],
                        'country': parts[-1]
                    }
            
            return self.geocode_with_retry(location)
            
        except Exception as e:
            logger.error(f"Error processing location {location}: {str(e)}")
            return {
                'original': location,
                'state_province': 'Error: Processing failed',
                'country': 'Error: Processing failed'
            }

def standardize_locations(locations: list, batch_size: int = 50) -> pd.DataFrame:
    standardizer = LocationStandardizer()
    results = []
    total = len(locations)
    
    for i in range(0, total, batch_size):
        batch = locations[i:i + batch_size]
        for loc in batch:
            try:
                result = standardizer.geocode_location(loc)
                results.append(result)
                time.sleep(1.5)
            except Exception as e:
                logger.error(f"Error processing location {loc}: {str(e)}")
                results.append({
                    'original': loc,
                    'state_province': 'Error: Processing failed',
                    'country': 'Error: Processing failed'
                })
        
        logger.info(f"Processed {min(i + batch_size, total)}/{total} locations")
    
    df = pd.DataFrame(results)
    return df
