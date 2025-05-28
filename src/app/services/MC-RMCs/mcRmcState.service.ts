import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

@Injectable({
  providedIn: "root",
})
export class MCRMCsServiceState {
  private baseUrl: string = environment.baseUrl;


  private msRMCs: any = {
    "MC Ahmedabad": {
      "states": [
        {
          "name": "GUJARAT",
          "url": "assets/geojson/state/ST_GUJARAT.json",
          "centre": [23.6708, 71.5724],
          "zoomfactor": 7
        },
        {
          "name": "DADRA & NAGAR HAVELI AND DAMAN & DIU (UT)",
          "url": "assets/geojson/state/ST_DADRA_&_NAGAR_HAVELI_AND_DAMAN_&_DIU_(UT).json",
          "centre": [20.6708, 71.8724],
          "zoomfactor": 8.1
        }
      ]
    },
    "MC Bengaluru": {
      "states": [
        {
          "name": "KARNATAKA",
          "url": "assets/geojson/state/ST_KARNATAKA.json",
          "centre": [15.3173, 76.7139],
          "zoomfactor": 7
        }
      ]
    },
    "MC Amaravati": {
      "states": [
        {
          "name": "PUDUCHERRY (UT)",
          "url": "assets/geojson/state/ST_PUDUCHERRY_(UT).json",
          "centre": [14.5129, 81.1000],
          "zoomfactor": 7
        },
        {
          "name": "ANDHRA PRADESH",
          "url": "assets/geojson/state/ST_ANDHRA_PRADESH.json",
          "centre": [16.9129, 81.1000],
          "zoomfactor": 6.7
        }
      ]
    },
    "MC Bhopal": {
      "states": [
        {
          "name": "MADHYA PRADESH",
          "url": "assets/geojson/state/ST_MADHYA_PRADESH.json",
          "centre": [23.5236, 78.414],
          "zoomfactor": 6.7
        }
      ]
    },
    "MC Bhubaneswar": {
      "states": [
        {
          "name": "ODISHA",
          "url": "assets/geojson/state/ST_ODISHA.json",
          "centre": [20.1342, 84.0167],
          "zoomfactor": 7
        }
      ]
    },
    "MC Chandigarh": {
      "states": [
        {
          "name": "CHANDIGARH (UT)",
          "url": "assets/geojson/state/ST_CHANDIGARH_(UT).json",
          "centre": [30.73, 76.771],
          "zoomfactor": 11.6
        },
        {
          "name": "PUNJAB",
          "url": "assets/geojson/state/ST_PUNJAB.json",
          "centre": [31.1, 75.451],
          "zoomfactor": 7.7
        },
        {
          "name": "HARYANA",
          "url": "assets/geojson/state/ST_HARYANA.json",
          "centre": [29.1, 76.451],
          "zoomfactor": 7.7
        }
      ]
    },
    "MC Dehradun": {
      "states": [
        {
          "name": "UTTARAKHAND",
          "url": "assets/geojson/state/ST_UTTARAKHAND.json",
          "centre": [30.4892, 78.9991],
          "zoomfactor": 7.7
        }
      ]
    },
    "MC Hyderabad": {
      "states": [
        {
          "name": "TELANGANA",
          "url": "assets/geojson/state/ST_TELANGANA.json",
          "centre": [17.7759, 79.1238],
          "zoomfactor": 7.4
        }
      ]
    },
    "MC Jaipur": {
      "states": [
        {
          "name": "RAJASTHAN",
          "url": "assets/geojson/state/ST_RAJASTHAN.json",
          "centre": [27.2389, 74.0243],
          "zoomfactor": 6.6
        }
      ]
    },
    "MC Lucknow": {
      "states": [
        {
          "name": "UTTAR PRADESH",
          "url": "assets/geojson/state/ST_UTTAR_PRADESH.json",
          "centre": [27.3965, 80.125],
          "zoomfactor": 6.6
        }
      ]
    },
    "MC Patna": {
      "states": [
        {
          "name": "BIHAR",
          "url": "assets/geojson/state/ST_BIHAR.json",
          "centre": [25.612677, 85.458875],
          "zoomfactor": 7.3
        }
      ]
    },
    "MC Raipur": {
      "states": [
        {
          "name": "CHHATTISGARH",
          "url": "assets/geojson/state/ST_CHHATTISGARH.json",
          "centre": [21.25, 82.629997],
          "zoomfactor": 7
        }
      ]
    },
    "MC Ranchi": {
      "states": [
        {
          "name": "JHARKHAND",
          "url": "assets/geojson/state/ST_JHARKHAND.json",
          "centre": [23.844315, 85.296013],
          "zoomfactor": 7
        }
      ]
    },
    "MC Shimla": {
      "states": [
        {
          "name": "HIMACHAL PRADESH",
          "url": "assets/geojson/state/ST_HIMACHAL_PRADESH.json",
          "centre": [32.1052, 77.1707],
          "zoomfactor": 7.6
        }
      ]
    },
    "MC Srinagar": {
      "states": [
        {
          "name": "JAMMU & KASHMIR (UT)",
          "url": "assets/geojson/state/ST_JAMMU_&_KASHMIR_(UT).json",
          "centre": [33.7139, 75.0149],
          "zoomfactor": 7.8
        },
        {
          "name": "LADAKH (UT)",
          "url": "assets/geojson/state/ST_LADAKH_(UT).json",
          "centre": [34.7739, 76.1349],
          "zoomfactor": 6.6
        }
      ]
    },
    "MC Thiruvanthapuram": {
      "states": [
        {
          "name": "KERALA",
          "url": "assets/geojson/state/ST_KERALA.json",
          "centre": [11.051, 76.0711],
          "zoomfactor": 7.6
        },
        {
          "name": "Lakshadweep",
          "url": "assets/geojson/state/ST_LAKSHADWEEP_(UT).json",
          "centre": [10.051, 73.0711],
          "zoomfactor": 7.6
        }
      ]
    },




    "MC PortBlair": {
      "states": [
        {
          "name": "Andaman & Nicobar Islands",
          "url": "assets/geojson/state/ST_ANDAMAN_&_NICOBAR_ISLANDS_(UT).json",
          "centre": [10.9900, 92.1411],
          "zoomfactor": 6.6
        }
      ]
    },

    "MC Itanagar": {
      "states": [
        {
          "name": "ARUNACHAL PRADESH",
          "url": "assets/geojson/state/ST_ARUNACHAL_PRADESH.json",
          "centre": [28.218, 94.7278],
          "zoomfactor": 7.1
        },
      ]
    },


    "MC Meghalaya Imphal": {
      "states": [
        {
          "name": "MEGHALAYA",
          "url": "assets/geojson/state/ST_MEGHALAYA.json",
          "centre": [25.467, 91.3662],
          "zoomfactor": 7.9
        },
        {
          "name": "MANIPUR",
          "url": "assets/geojson/state/ST_MANIPUR.json",
          "centre": [24.6637, 93.9063],
          "zoomfactor": 8.6
        },
      ]
    },
    


    "MC Manipur Imphal": {
      "states": [
        {
          "name": "MANIPUR",
          "url": "assets/geojson/state/ST_MANIPUR.json",
          "centre": [24.6637, 93.9063],
          "zoomfactor": 8.6
        },
      ]
    },
    


    "MC Aizawl": {
      "states": [
        {
          "name": "MIZORAM",
          "url": "assets/geojson/state/ST_MIZORAM.json",
          "centre": [23.1645, 92.9376],
          "zoomfactor": 8.3
        },
        {
          "name": "TRIPURA",
          "url": "assets/geojson/state/ST_TRIPURA.json",
          "centre": [23.7451, 91.7468],
          "zoomfactor": 9.0
        }
      ]
    },


    "MC Kohima": {
      "states": [
        {
          "name": "NAGALAND",
          "url": "assets/geojson/state/ST_NAGALAND.json",
          "centre": [26.1584, 94.5624],
          "zoomfactor": 8.5
        },
      ]
    },



 
    
    
    
    



    "RMC Chennai": {
      "states": [
        {
          "name": "TAMILNADU",
          "url": "assets/geojson/state/ST_TAMILNADU.json",
          "centre": [10.9601, 78.0766],
          "zoomfactor": 7
        }
      ]
    },
    "RMC Guwahati": {
      "states": [
        {
          "name": "ASSAM",
          "url": "assets/geojson/state/ST_ASSAM.json",
          "centre": [26.2006, 92.9376],
          "zoomfactor": 7.1
        },
        {
          "name": "ARUNACHAL PRADESH",
          "url": "assets/geojson/state/ST_ARUNACHAL_PRADESH.json",
          "centre": [28.218, 94.7278],
          "zoomfactor": 7.1
        },
        {
          "name": "NAGALAND",
          "url": "assets/geojson/state/ST_NAGALAND.json",
          "centre": [26.1584, 94.5624],
          "zoomfactor": 8.5
        },
        {
          "name": "MANIPUR",
          "url": "assets/geojson/state/ST_MANIPUR.json",
          "centre": [24.6637, 93.9063],
          "zoomfactor": 8.6
        },
        {
          "name": "MIZORAM",
          "url": "assets/geojson/state/ST_MIZORAM.json",
          "centre": [23.1645, 92.9376],
          "zoomfactor": 8.3
        },
        {
          "name": "MEGHALAYA",
          "url": "assets/geojson/state/ST_MEGHALAYA.json",
          "centre": [25.467, 91.3662],
          "zoomfactor": 7.9
        },
        {
          "name": "TRIPURA",
          "url": "assets/geojson/state/ST_TRIPURA.json",
          "centre": [23.7451, 91.7468],
          "zoomfactor": 9.0
        }
      ]
    },
    "RMC Kolkata": {
      "states": [
        {
          "name": "WEST BENGAL",
          "url": "assets/geojson/state/ST_WEST_BENGAL.json",
          "centre": [23.9900, 88.1411],
          "zoomfactor": 6.7
        },
        {
          "name": "ANDAMAN & NICOBAR ISLANDS (UT)",
          "url": "assets/geojson/state/ST_ANDAMAN_&_NICOBAR_ISLANDS_(UT).json",
          "centre": [10.9900, 92.1411],
          "zoomfactor": 6.6
        },
        {
          "name": "SIKKIM",
          "url": "assets/geojson/state/ST_SIKKIM.json",
          "centre": [27.8, 88.4911],
          "zoomfactor": 9
        }
      ]
    },
    "RMC Mumbai": {
      "states": [
        {
          "name": "MAHARASHTRA",
          "url": "assets/geojson/state/ST_MAHARASHTRA.json",
          "centre": [19.0948, 76.748],
          "zoomfactor": 6.3
        },
        {
          "name": "GOA",
          "url": "assets/geojson/state/ST_GOA.json",
          "centre": [15.3, 74.03],
          "zoomfactor": 9.8
        }
      ]
    },
    "RMC Nagpur": {
      "states": [
        {
          "name": "MAHARASHTRA",
          "url": "assets/geojson/state/ST_MAHARASHTRA.json",
          "centre": [20.146633, 77.08886],
          "zoomfactor": 6.6
        }
      ]
    },
    "RMC New Delhi": {
      "states": [
        {
          "name": "DELHI (UT)",
          "url": "assets/geojson/state/ST_DELHI_(UT).json",
          "centre": [28.7199, 77.1000],
          "zoomfactor": 10
        }
      ]
    }
  };

  listOfmsRMCs: any = ["HYD", "BBN", "BNG"];

  constructor(private http: HttpClient) {}

  fetchMcRMcData(date: string): Observable<any> {
    let url = `${this.baseUrl}/api/v1/fetchStationData`;

    const body = {
      Date: date,
    };
    return this.http.post<any>(url, body);
  }

  getMcRMCsJson() {
    return this.msRMCs;
  }

  getListOfMcRMCs() {
    return Object.keys(this.msRMCs);
  }

  getCoordinates(mcName: string, stateName: string): any{
    const mc = this.msRMCs[mcName];
    if (!mc || !mc.states) {
      console.error(`MC/RMC '${mcName}' not found`);
      return [0, 0]; // Default coordinates as fallback
    }

    const state = mc.states.find((x: any) => x.name === stateName);
    if (!state) {
      console.error(`State '${stateName}' not found in '${mcName}'`);
      return [0, 0]; // Default coordinates as fallback
    }

    return state.centre;
  }

  getZoomFactor(mcName: string, stateName: string): number {
    const mc = this.msRMCs[mcName];
    if (!mc || !mc.states) {
      console.error(`MC/RMC '${mcName}' not found`);
      return 7; // Default zoom factor as fallback
    }

    const state = mc.states.find((x: any) => x.name === stateName);
    if (!state) {
      console.error(`State '${stateName}' not found in '${mcName}'`);
      return 7; // Default zoom factor as fallback
    }

    return state.zoomfactor;
  }
}
