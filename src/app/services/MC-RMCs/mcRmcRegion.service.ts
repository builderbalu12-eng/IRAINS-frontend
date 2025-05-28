import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

@Injectable({
  providedIn: "root",
})
export class MCRMCsServiceRegion {
  private baseUrl: string = environment.baseUrl;

  private msRMCs: any = {
    'CENTRAL INDIA' : {
      "url" : 'assets/geojson/regions/C_India.json',
      "centre": [22, 77.9999],
      "zoomfactor": 5.5
    },
    'EAST AND NORTH EAST INDIA' : {
      "url" : 'assets/geojson/regions/EAST_AND_NORTH_EAST_INDIA.json',
      "centre": [25, 89.9999], 
      "zoomfactor": 6
    },
    'NORTH WEST INDIA' : {
      "url" : 'assets/geojson/regions/NORTH_WEST_INDIA.json',
      "centre": [30.444, 76.9999], 
      "zoomfactor": 5.7
    },
    'SOUTH PENINSULA' : {
      "url" : 'assets/geojson/regions/SOUTH_PENINSULA.json',
      "centre": [15, 78.288], 
      "zoomfactor": 6
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


  getUrlofParticukarMC(centre_name:any){
    console.log('getting getUrlofParticukarMC', centre_name, this.msRMCs[centre_name].url)
    return this.msRMCs[centre_name].url
  }

  getCordinates(centre_name: any) {
    return this.msRMCs[centre_name].centre;
  }

  getZoomFactor(centre_name: any) {
    return this.msRMCs[centre_name].zoomfactor;
  }
}
