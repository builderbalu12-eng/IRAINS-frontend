import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

@Injectable({
  providedIn: "root",
})
export class MCRMCsServiceSubdiv {
  private baseUrl: string = environment.baseUrl;
  // private msRMCs: any = {
  //   "MC Ahmedabad": {
  //     "subdivisions": [
  //       {
  //         "name": "Gujarat Region",
  //         "url": "assets/geojson/subdivision/Gujrat_Region.json",
  //         "centre": [23.0, 72.6], // Central Gujarat (e.g., Ahmedabad area)
  //         "zoomfactor": 7
  //       },
  //       {
  //         "name": "Saurashtra & Kutch",
  //         "url": "assets/geojson/subdivision/SD_Saurashtra_&_Kutch.json",
  //         "centre": [23.3, 70], // Central Saurashtra (e.g., Rajkot area)
  //         "zoomfactor": 7.3
  //       }
  //     ]
  //   },
  //   "MC Bengaluru": {
  //     "subdivisions": [
  //       {
  //         "name": "Southern Interior Karnataka",
  //         "url": "assets/geojson/subdivision/SD_SOUTHERN_INTERIOR_KARNATAKA.json",
  //         "centre": [14.0, 76.5], // Near Bengaluru
  //         "zoomfactor": 7.4
  //       },
  //       {
  //         "name": "Northern Interior Karnataka",
  //         "url": "assets/geojson/subdivision/SD_NORTHERN_INTERIOR_KARNATAKA.json",
  //         "centre": [14.0, 76.5], // Near Bengaluru
  //         "zoomfactor": 7.4
  //       },
  //       {
  //         "name": "Coastal Karnataka",
  //         "url": "assets/geojson/subdivision/SD_COASTAL_KARNATAKA.json",
  //         "centre": [14.5, 74.8], // Near Mangalore
  //         "zoomfactor": 7.9
  //       }
  //     ]
  //   },
  //   "MC Amaravati": {
  //     "subdivisions": [
  //       {
  //         "name": "Rayalseema",
  //         "url": "assets/geojson/subdivision/SD_RAYALSEEMA.json",
  //         "centre": [14.5, 78.5], // Near Tirupati
  //         "zoomfactor": 7.5
  //       },
  //       {
  //         "name": "Coastal Andhra Pradesh & Yanam",
  //         "url": "assets/geojson/subdivision/SD_COASTAL_ANDHRA_PRADESH_&_YANAM.json",
  //         "centre": [16.5, 82.0], // Near Visakhapatnam
  //         "zoomfactor": 6.9
  //       }
  //     ]
  //   },
  //   "MC Bhopal": {
  //     "subdivisions": [
  //       {
  //         "name": "East Madhya Pradesh",
  //         "url": "assets/geojson/subdivision/East_Madhya_Pradesh.json",
  //         "centre": [23.2, 80.0], // Near Jabalpur
  //         "zoomfactor": 7.2
  //       },
  //       {
  //         "name": "West Madhya Pradesh",
  //         "url": "assets/geojson/subdivision/SD_West_Madhya_Pradesh.json",
  //         "centre": [24.0, 76.6], // Near Indore
  //         "zoomfactor": 6.9
  //       }
  //     ]
  //   },
  //   "MC Bhubaneswar": {
  //     "subdivisions": [
  //       {
  //         "name": "Odisha",
  //         "url": "assets/geojson/subdivision/SD_Odishat.json",
  //         "centre": [20.3, 84], // Near Bhubaneswar
  //         "zoomfactor": 7
  //       }
  //     ]
  //   },
  //   "MC Chandigarh": {
  //     "subdivisions": [
  //       {
  //         "name": "DELHI HARYANA AND CHANDIGARH",
  //         "url": "assets/geojson/subdivision/SD_DELHI,_HARYANA_AND_CHANDIGARH.json",
  //         "centre": [29.73, 75.771],
  //         "zoomfactor": 7.7
  //       },
  //       {
  //         "name": "Punjab",
  //         "url": "assets/geojson/subdivision/SD_PUNJAB.json",
  //         "centre": [31.0, 75.5], // Near Ludhiana
  //         "zoomfactor": 7.7
  //       }
  //     ]
  //   },
  //   "MC Dehradun": {
  //     "subdivisions": [
  //       {
  //         "name": "Uttarakhand",
  //         "url": "assets/geojson/subdivision/SD_UTTARAKHAND.json",
  //         "centre": [30.3, 79.0], // Near Dehradun
  //         "zoomfactor": 7.7
  //       }
  //     ]
  //   },
  //   "MC Hyderabad": {
  //     "subdivisions": [
  //       {
  //         "name": "Telangana",
  //         "url": "assets/geojson/subdivision/SD_TELANGANA.json",
  //         "centre": [18.4, 79.1], // Near Hyderabad
  //         "zoomfactor": 7.4
  //       }
  //     ]
  //   },
  //   "MC Jaipur": {
  //     "subdivisions": [
  //       {
  //         "name": "West Rajasthan",
  //         "url": "assets/geojson/subdivision/SD_WEST_RAJASTHAN.json",
  //         "centre": [26.9, 73.0], // Near Jodhpur
  //         "zoomfactor": 6.8
  //       },
  //       {
  //         "name": "East Rajasthan",
  //         "url": "assets/geojson/subdivision/SD_EAST_RAJASTHAN.json",
  //         "centre": [26.9, 75.0], // Near Jodhpur
  //         "zoomfactor": 6.8
  //       }
  //     ]
  //   },
  //   "MC Lucknow": {
  //     "subdivisions": [
  //       {
  //         "name": "East Uttar Pradesh",
  //         "url": "assets/geojson/subdivision/SD_EAST_UTTAR_PRADESH.json", // Likely should be East_Uttar_Pradesh.json
  //         "centre": [26.5, 82.0], // Near Varanasi (assuming East UP)
  //         "zoomfactor": 7.1
  //       },
  //       {
  //         "name": "West Uttar Pradesh",
  //         "url": "assets/geojson/subdivision/SD_WEST_UTTAR_PRADESH.json",
  //         "centre": [27.5, 79.0], // Near Agra
  //         "zoomfactor": 7
  //       }
  //     ]
  //   },
  //   "MC Patna": {
  //     "subdivisions": [
  //       {
  //         "name": "Bihar",
  //         "url": "assets/geojson/subdivision/SD_BIHAR.json",
  //         "centre": [26.6, 85.5], // Near Patna
  //         "zoomfactor": 7.3
  //       }
  //     ]
  //   },
  //   "MC Raipur": {
  //     "subdivisions": [
  //       {
  //         "name": "Chhattisgarh",
  //         "url": "assets/geojson/subdivision/Chattisgarh.json",
  //         "centre": [21.2, 81.6], // Near Raipur
  //         "zoomfactor": 7
  //       }
  //     ]
  //   },
  //   "MC Ranchi": {
  //     "subdivisions": [
  //       {
  //         "name": "Jharkhand",
  //         "url": "assets/geojson/subdivision/SD_JHARKHAND.json",
  //         "centre": [23.3, 85.3], // Near Ranchi
  //         "zoomfactor": 7
  //       }
  //     ]
  //   },
  //   "MC Shimla": {
  //     "subdivisions": [
  //       {
  //         "name": "Himachal Pradesh",
  //         "url": "assets/geojson/subdivision/SD_HIMACHAL_PRADESH.json",
  //         "centre": [32.1, 77.2], // Near Shimla
  //         "zoomfactor": 7.6
  //       }
  //     ]
  //   },
  //   "MC Srinagar": {
  //     "subdivisions": [
  //       {
  //         "name": "Jammu & Kashmir and Ladakh",
  //         "url": "assets/geojson/subdivision/SD_JAMMU_&_KASHMIR_AND_LADAKH.json",
  //         "centre": [34.1, 74.8], // Near Srinagar
  //         "zoomfactor": 6.6
  //       }
  //     ]
  //   },
  //   "MC Thiruvanthapuram": {
  //     "subdivisions": [
  //       {
  //         "name": "Kerala & Mahe",
  //         "url": "assets/geojson/subdivision/SD_KERALA_&_MAHE.json",
  //         "centre": [10.5, 75.9], // Near Thiruvananthapuram
  //         "zoomfactor": 7.6
  //       },
  //       {
  //         "name": "Lakshadweep",
  //         "url": "assets/geojson/subdivision/SD_LAKSHADWEEP.json",
  //         "centre": [10.5, 72.9], // Near Thiruvananthapuram
  //         "zoomfactor": 7.6
  //       }
  //     ]
  //   },

  //   "MC PortBlair": {
  //     "subdivisions": [
  //       {
  //         "name": "Andaman & Nicobar Islands",
  //         "url": "assets/geojson/subdivision/SD_ANDAMAN_&_NICOBAR_ISLANDS.json",
  //         "centre": [11.7, 92.7], // Near Port Blair
  //         "zoomfactor": 5.4
  //       }
  //     ]
  //   },

  //   "RMC Chennai": {
  //     "subdivisions": [
  //       {
  //         "name": "Tamil Nadu, Puducherry & Karaikal",
  //         "url": "assets/geojson/subdivision/SD_TAMILNADU,_PUDUCHERRY_&_KARAIKAL.json",
  //         "centre": [12.0, 78.2], // Near Chennai
  //         "zoomfactor": 7
  //       }
  //     ]
  //   },
  //   "RMC Guwahati": {
  //     "subdivisions": [
  //       {
  //         "name": "Assam & Meghalaya",
  //         "url": "assets/geojson/subdivision/SD_ASSAM_&_MEGHALAYA.json",
  //         "centre": [26.1, 92.7], // Near Guwahati
  //         "zoomfactor": 7
  //       },
  //       {
  //         "name": "Nagaland, Manipur, Mizoram & Tripura",
  //         "url": "assets/geojson/subdivision/SD_NMMT.json",
  //         "centre": [25.0, 93.5], // Central point for NMMT (e.g., near Imphal)
  //         "zoomfactor": 7.3
  //       },
  //       {
  //         "name": "Arunachal Pradesh",
  //         "url": "assets/geojson/subdivision/SD_Arunachal_Pradesh.json",
  //         "centre": [28.1, 94.6], // Near Itanagar
  //         "zoomfactor": 7.2
  //       }
  //     ]
  //   },
  //   "RMC Kolkata": {
  //     "subdivisions": [
  //       {
  //         "name": "Gangetic West Bengal",
  //         "url": "assets/geojson/subdivision/SD_GANGETIC_WEST_BENGAL.json",
  //         "centre": [22.6, 88.4], // Near Kolkata
  //         "zoomfactor": 5.4
  //       },
  //       {
  //         "name": "Sub-Himalayan West Bengal & Sikkim",
  //         "url": "assets/geojson/subdivision/SD_SHWB_&_SIKKIM.json",
  //         "centre": [27.0, 88.5], // Near Gangtok
  //         "zoomfactor": 5.4
  //       },
  //       {
  //         "name": "Andaman & Nicobar Islands",
  //         "url": "assets/geojson/subdivision/SD_ANDAMAN_&_NICOBAR_ISLANDS.json",
  //         "centre": [11.7, 92.7], // Near Port Blair
  //         "zoomfactor": 5.4
  //       }
  //     ]
  //   },
  //   "RMC Mumbai": {
  //     "subdivisions": [
  //       {
  //         "name": "Madhya Maharashtra",
  //         "url": "assets/geojson/subdivision/SD_Madhya_Maharashtra.json",
  //         "centre": [18.5, 74.8], // Near Pune
  //         "zoomfactor": 7
  //       },
  //       {
  //         "name": "Marathwada",
  //         "url": "assets/geojson/subdivision/SD_Marathwada.json",
  //         "centre": [19.2, 76.3], // Near Aurangabad
  //         "zoomfactor": 7.6
  //       },
  //       {
  //         "name": "Konkan & Goa",
  //         "url": "assets/geojson/subdivision/SD_konkan_&_goa.json",
  //         "centre": [18.0, 73.0], // Near Mumbai
  //         "zoomfactor": 7.3
  //       }
  //     ]
  //   },
  //   "RMC Nagpur": {
  //     "subdivisions": [
  //       {
  //         "name": "Vidarbha",
  //         "url": "assets/geojson/subdivision/SD_Vidarbha.json",
  //         "centre": [20.9, 78.0], // Near Nagpur
  //         "zoomfactor": 7.2
  //       }
  //     ]
  //   },
  //   "RMC New Delhi": {
  //     "subdivisions": [
  //       {
  //         "name": "Delhi (UT)",
  //         "url": "assets/geojson/state/ST_DELHI_(UT).json",
  //         "centre": [28.6, 77.2], // Near New Delhi
  //         "zoomfactor": 10
  //       }
  //     ]
  //   }
  // };



  private msRMCs: any = {
    "MC Ahmedabad": {
      subdivisions: [
        {
          name: "Gujarat Region",
          url: "assets/geojson/subdivision/Gujrat_Region.json",
          centre: [23.0, 72.6], // Central Gujarat (e.g., Ahmedabad area)
          zoomfactor: 7,
        },
        {
          name: "Saurashtra & Kutch",
          url: "assets/geojson/subdivision/SD_Saurashtra_&_Kutch.json",
          centre: [23.3, 70], // Central Saurashtra (e.g., Rajkot area)
          zoomfactor: 7.3,
        },
        {
          name: "Dadra & Nagar Haveli and Daman & Diu (UT)",
          url: "assets/geojson/subdivision/SD_DADRA_&_NAGAR_HAVELI_AND_DAMAN_&_DIU_(UT).json",
          centre: [20.6708, 71.8724], // From previous state data
          zoomfactor: 8.1,
        },
      ],
    },
    "MC Bengaluru": {
      subdivisions: [
        {
          name: "Southern Interior Karnataka",
          url: "assets/geojson/subdivision/SD_SOUTHERN_INTERIOR_KARNATAKA.json",
          centre: [14.0, 76.5], // Near Bengaluru
          zoomfactor: 7.4,
        },
        {
          name: "Northern Interior Karnataka",
          url: "assets/geojson/subdivision/SD_NORTHERN_INTERIOR_KARNATAKA.json",
          centre: [14.0, 76.5], // Near Bengaluru
          zoomfactor: 7.4,
        },
        {
          name: "Coastal Karnataka",
          url: "assets/geojson/subdivision/SD_COASTAL_KARNATAKA.json",
          centre: [14.5, 74.8], // Near Mangalore
          zoomfactor: 7.9,
        },
      ],
    },
    "MC Amaravati": {
      subdivisions: [
        {
          name: "Rayalseema",
          url: "assets/geojson/subdivision/SD_RAYALSEEMA.json",
          centre: [14.5, 78.5], // Near Tirupati
          zoomfactor: 7.5,
        },
        {
          name: "Coastal Andhra Pradesh & Yanam",
          url: "assets/geojson/subdivision/SD_COASTAL_ANDHRA_PRADESH_&_YANAM.json",
          centre: [16.5, 82.0], // Near Visakhapatnam
          zoomfactor: 6.9,
        },
        {
          name: "Puducherry (UT)",
          url: "assets/geojson/subdivision/SD_PUDUCHERRY_(UT).json",
          centre: [14.5129, 81.1000], // From previous state data
          zoomfactor: 7,
        },
      ],
    },
    "MC Bhopal": {
      subdivisions: [
        {
          name: "East Madhya Pradesh",
          url: "assets/geojson/subdivision/East_Madhya_Pradesh.json",
          centre: [23.2, 80.0], // Near Jabalpur
          zoomfactor: 7.2,
        },
        {
          name: "West Madhya Pradesh",
          url: "assets/geojson/subdivision/SD_West_Madhya_Pradesh.json",
          centre: [24.0, 76.6], // Near Indore
          zoomfactor: 6.9,
        },
      ],
    },
    "MC Bhubaneswar": {
      subdivisions: [
        {
          name: "Odisha",
          url: "assets/geojson/subdivision/SD_Odishat.json",
          centre: [20.3, 84], // Near Bhubaneswar
          zoomfactor: 7,
        },
      ],
    },
    "MC Chandigarh": {
      subdivisions: [
        {
          name: "DELHI HARYANA AND CHANDIGARH",
          url: "assets/geojson/subdivision/SD_DELHI,_HARYANA_AND_CHANDIGARH.json",
          centre: [29.73, 75.771],
          zoomfactor: 7.7,
        },
        {
          name: "Punjab",
          url: "assets/geojson/subdivision/SD_PUNJAB.json",
          centre: [31.0, 75.5], // Near Ludhiana
          zoomfactor: 7.7,
        },
      ],
    },
    "MC Dehradun": {
      subdivisions: [
        {
          name: "Uttarakhand",
          url: "assets/geojson/subdivision/SD_UTTARAKHAND.json",
          centre: [30.3, 79.0], // Near Dehradun
          zoomfactor: 7.7,
        },
      ],
    },
    "MC Hyderabad": {
      subdivisions: [
        {
          name: "Telangana",
          url: "assets/geojson/subdivision/SD_TELANGANA.json",
          centre: [18.4, 79.1], // Near Hyderabad
          zoomfactor: 7.4,
        },
      ],
    },
    "MC Jaipur": {
      subdivisions: [
        {
          name: "West Rajasthan",
          url: "assets/geojson/subdivision/SD_WEST_RAJASTHAN.json",
          centre: [26.9, 73.0], // Near Jodhpur
          zoomfactor: 6.8,
        },
        {
          name: "East Rajasthan",
          url: "assets/geojson/subdivision/SD_EAST_RAJASTHAN.json",
          centre: [26.9, 75.0], // Near Jaipur
          zoomfactor: 6.8,
        },
      ],
    },
    "MC Lucknow": {
      subdivisions: [
        {
          name: "East Uttar Pradesh",
          url: "assets/geojson/subdivision/SD_EAST_UTTAR_PRADESH.json",
          centre: [26.5, 82.0], // Near Varanasi
          zoomfactor: 7.1,
        },
        {
          name: "West Uttar Pradesh",
          url: "assets/geojson/subdivision/SD_WEST_UTTAR_PRADESH.json",
          centre: [27.5, 79.0], // Near Agra
          zoomfactor: 7,
        },
      ],
    },
    "MC Patna": {
      subdivisions: [
        {
          name: "Bihar",
          url: "assets/geojson/subdivision/SD_BIHAR.json",
          centre: [26.6, 85.5], // Near Patna
          zoomfactor: 7.3,
        },
      ],
    },
    "MC Raipur": {
      subdivisions: [
        {
          name: "Chhattisgarh",
          url: "assets/geojson/subdivision/Chattisgarh.json",
          centre: [21.2, 81.6], // Near Raipur
          zoomfactor: 7,
        },
      ],
    },
    "MC Ranchi": {
      subdivisions: [
        {
          name: "Jharkhand",
          url: "assets/geojson/subdivision/SD_JHARKHAND.json",
          centre: [23.3, 85.3], // Near Ranchi
          zoomfactor: 7,
        },
      ],
    },
    "MC Shimla": {
      subdivisions: [
        {
          name: "Himachal Pradesh",
          url: "assets/geojson/subdivision/SD_HIMACHAL_PRADESH.json",
          centre: [32.1, 77.2], // Near Shimla
          zoomfactor: 7.6,
        },
      ],
    },
    "MC Srinagar": {
      subdivisions: [
        {
          name: "Jammu & Kashmir and Ladakh",
          url: "assets/geojson/subdivision/SD_JAMMU_&_KASHMIR_AND_LADAKH.json",
          centre: [34.1, 74.8], // Near Srinagar
          zoomfactor: 6.6,
        },
      ],
    },
    "MC Thiruvanthapuram": {
      subdivisions: [
        {
          name: "Kerala & Mahe",
          url: "assets/geojson/subdivision/SD_KERALA_&_MAHE.json",
          centre: [10.5, 75.9], // Near Thiruvananthapuram
          zoomfactor: 7.6,
        },
        {
          name: "Lakshadweep",
          url: "assets/geojson/subdivision/SD_LAKSHADWEEP.json",
          centre: [10.5, 72.9], // Near Lakshadweep
          zoomfactor: 7.6,
        },
      ],
    },
    "MC Vijayapuram": {
      subdivisions: [
        {
          name: "Andaman & Nicobar Islands",
          url: "assets/geojson/subdivision/SD_ANDAMAN_&_NICOBAR_ISLANDS.json",
          centre: [11.6234, 92.7265], // From previous MCRMCsService
          zoomfactor:6,
        },
      ],
    },
    "MC Agartala": {
      subdivisions: [
        {
          name: "Tripura",
          url: "assets/geojson/subdivision/SD_TRIPURA.json",
          centre: [23.8315, 91.2868], // From previous MCRMCsService
          zoomfactor: 9.0,
        },
      ],
    },
    "MC Aizawl": {
      subdivisions: [
        {
          name: "Mizoram",
          url: "assets/geojson/subdivision/SD_MIZORAM.json",
          centre: [23.7271, 92.7176], // From previous MCRMCsService
          zoomfactor: 8.3,
        },
      ],
    },
    "MC Gangtok": {
      subdivisions: [
        {
          name: "Sikkim",
          url: "assets/geojson/subdivision/SD_SHWB_&_SIKKIM.json",
          centre: [27.3389, 88.6065], // From previous MCRMCsService
          zoomfactor: 9,
        },
      ],
    },
    "MC Imphal": {
      subdivisions: [
        {
          name: "Manipur",
          url: "assets/geojson/subdivision/SD_MANIPUR.json",
          centre: [24.8170, 93.9368], // From previous MCRMCsService
          zoomfactor: 8.6,
        },
      ],
    },
    "MC Itanagar": {
      subdivisions: [
        {
          name: "Arunachal Pradesh",
          url: "assets/geojson/subdivision/SD_Arunachal_Pradesh.json",
          centre: [27.0844, 93.6053], // From previous MCRMCsService
          zoomfactor: 7.1,
        },
      ],
    },
    "MC Kohima": {
      subdivisions: [
        {
          name: "Nagaland",
          url: "assets/geojson/subdivision/SD_NAGALAND.json",
          centre: [25.6586, 94.1053], // From previous MCRMCsService
          zoomfactor: 8.5,
        },
      ],
    },
    "MC Shillong": {
      subdivisions: [
        {
          name: "Meghalaya",
          url: "assets/geojson/subdivision/SD_ASSAM_&_MEGHALAYA.json",
          centre: [25.5788, 91.8933], // From previous MCRMCsService
          zoomfactor: 7.9,
        },
      ],
    },
    "RMC Chennai": {
      subdivisions: [
        {
          name: "Tamil Nadu, Puducherry & Karaikal",
          url: "assets/geojson/subdivision/SD_TAMILNADU,_PUDUCHERRY_&_KARAIKAL.json",
          centre: [12.0, 78.2], // Near Chennai
          zoomfactor: 7,
        },
      ],
    },
    "RMC Guwahati": {
      subdivisions: [
        {
          name: "Assam & Meghalaya",
          url: "assets/geojson/subdivision/SD_ASSAM_&_MEGHALAYA.json",
          centre: [26.1, 92.7], // Near Guwahati
          zoomfactor: 7,
        },
      ],
    },
    "RMC Kolkata": {
      subdivisions: [
        {
          name: "Gangetic West Bengal",
          url: "assets/geojson/subdivision/SD_GANGETIC_WEST_BENGAL.json",
          centre: [22.6, 88.4], // Near Kolkata
          zoomfactor: 5.4,
        },
      ],
    },
    "RMC Mumbai": {
      subdivisions: [
        {
          name: "Madhya Maharashtra",
          url: "assets/geojson/subdivision/SD_Madhya_Maharashtra.json",
          centre: [18.5, 74.8], // Near Pune
          zoomfactor: 7,
        },
        {
          name: "Marathwada",
          url: "assets/geojson/subdivision/SD_Marathwada.json",
          centre: [19.2, 76.3], // Near Aurangabad
          zoomfactor: 7.6,
        },
        {
          name: "Konkan & Goa",
          url: "assets/geojson/subdivision/SD_konkan_&_goa.json",
          centre: [18.0, 73.0], // Near Mumbai
          zoomfactor: 7.3,
        },
      ],
    },
    "RMC Nagpur": {
      subdivisions: [
        {
          name: "Vidarbha",
          url: "assets/geojson/subdivision/SD_Vidarbha.json",
          centre: [20.9, 78.0], // Near Nagpur
          zoomfactor: 7.2,
        },
      ],
    },
    "RMC New Delhi": {
      subdivisions: [
        {
          name: "Delhi (UT)",
          url: "assets/geojson/state/ST_DELHI_(UT).json",
          centre: [28.6, 77.2], // Near New Delhi
          zoomfactor: 10,
        },
      ],
    },
  };


  constructor(private http: HttpClient) {}

  fetchMcRMcData(date: string): Observable<any> {
    let url = `${this.baseUrl}/api/v1/fetchStationData`;
    const body = { Date: date };
    return this.http.post<any>(url, body);
  }

  getMcRMCsJson() {
    return this.msRMCs;
  }

  getListOfMcRMCs() {
    return Object.keys(this.msRMCs);
  }

  getCoordinates(mcName: string, subdivisionName: string): [number, number] {
    const mc = this.msRMCs[mcName];
    if (!mc || !mc.subdivisions) {
      console.error(`MC/RMC '${mcName}' not found`);
      return [0, 0];
    }

    const subdivision = mc.subdivisions.find((x: any) => x.name === subdivisionName);
    if (!subdivision) {
      console.error(`Subdivision '${subdivisionName}' not found in '${mcName}'`);
      return [0, 0];
    }

    return subdivision.centre as [number, number];
  }

  getZoomFactor(mcName: string, subdivisionName: string): number {
    const mc = this.msRMCs[mcName];
    if (!mc || !mc.subdivisions) {
      console.error(`MC/RMC '${mcName}' not found`);
      return 7;
    }

    const subdivision = mc.subdivisions.find((x: any) => x.name == subdivisionName);
    if (!subdivision) {
      console.error(`Subdivision '${subdivisionName}' not found in '${mcName}'`);
      return 7;
    }

    return subdivision.zoomfactor;
  }
}
