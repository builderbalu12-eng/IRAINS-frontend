import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { DataEntryService } from '../services/dataEntry/dataEntry.service';
import { VerificationHq } from '../services/verification/verificationHq.service';

@Component({
  selector: 'app-verification-page',
  templateUrl: './verification-page-mc.component.html',
  styleUrls: ['./verification-page-mc.component.css']
})

export class VerificationPageMcComponent {
  isLoading: boolean = false;
  currentMCorRMC = "";
  noOfUpdateVerified = 0;
  noOfUpdateNotVerified = 0;
  noOfVerified = 0;
  noOfNotVerfied = 0;
  showIsUpdatesTable: boolean = false;
  showIsNotUpdatesTable: boolean = false;
  showIsVerifiedTable: boolean = false;
  showIsNotVerifiedTable: boolean = false;
  showTotalStationsTable: boolean = false;
  dataToDisplay: any[] = [];
  bottom_section: boolean = false;
  filteredMcs: any[] = [];
  filteredRMcs: any[] = [];
  selectedDate: any = this.formatDate(new Date())
  todayDate: string;
  existingstationdata: any[] = [];
  typeSubmit: string = '';
  loggedInUser: any;
  currentUserType: any;
  fetcheddata: any = [];
  isVerificationLoading: any = false;
  devationStatus: any;
  isVerifiactionButtonClicked: any = false;
  isLoadingVerificatiion: any = false;
  isVerifactionButtonClicked: any = false;




  constructor(
    private dataService: DataService,
    private verificationhq : VerificationHq,
    private dataEntryService : DataEntryService
  ) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    this.todayDate = yyyy + '-' + mm + '-' + dd;
  }

  ngOnInit(): void {
    const loginedMC = localStorage.getItem('isAuthorised');
    const MCData = JSON.parse(loginedMC ?? '{}');
    const loginedMCName = MCData.data[0].name;
    this.currentUserType = MCData.data[0].userid;
    
    if(loginedMCName.split(" ")[0] == "MC"){
      this.currentMCorRMC = loginedMCName
      this.filteredMcs.push({name: loginedMCName})
    } else {
      this.currentMCorRMC = loginedMCName
      this.filteredRMcs.push({name: loginedMCName})
    }
    this.currentMCorRMC = this.currentMCorRMC.toUpperCase();
    // this.fetchDataFromBackend();
    this.backend();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  goBack() {
    window.history.back();
  }

  backend(): Promise<void> {
    this.isLoading = true;
    const date = this.selectedDate;

    return new Promise((resolve, reject) => {
      this.verificationhq.fetchStationDataForDataEntry(date).subscribe(
        (response) => {
          this.fetcheddata = response.data.filter((x: any) => {
            if (!x.centre_type || !x.centre_name) return false;
            return (x.centre_type.toUpperCase() + ' ' + x.centre_name.toUpperCase()) === this.currentMCorRMC.toUpperCase();
          });
          this.filterByDate();
          this.isLoading = false;
          resolve();
        },
        (err) => {
          console.error('Error fetching data:', err);
          this.isLoading = false;
          reject(err);
        }
      );
    });
  }


  async VerifySelected() {
    if (this.selectedStations.length === 0) {
      alert("Please select at least one station to verify.");
      return;
    }
  
    if (confirm("Do you want to verify the selected stations?")) {
      this.isLoading = true;
  
      const data = {
        "date": this.selectedDate,
        "station_ids": this.selectedStations,
        "userid": +this.currentUserType
      };
  
      try {
        await this.verificationhq.verifyAll(data).subscribe(async () => {
          alert("Selected stations verified successfully");
          await this.backend();
          this.dataToDisplay.forEach(station => {
            if (this.selectedStations.includes(Number(station.stationid))) {
              station.status = 'Verified';
            }
          });
          this.selectedStations = []; // Clear the selection after verification
        });
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
  }


  filterByDate() {
    this.noOfNotVerfied = this.fetcheddata.filter((x: any) => x.is_verified==0 && x.data!=-999.9).length;
    this.noOfVerified = this.fetcheddata.filter((x: any) => x.is_verified==1&& x.data!=-999.9).length;
    this.noOfUpdateVerified = this.fetcheddata.filter((x: any) => x.data != -999.9).length;
    this.noOfUpdateNotVerified = this.fetcheddata.filter((x: any) => x.data == -999.9).length;
  }

  showMessage(elementRef: any) {
    const value = elementRef.value.trim();
    const regex = /^\d+(\.\d)?$|^\d+(\.\d)?$/;
    if (regex.test(value)) {
      elementRef.style.background = '';
    } else {
      elementRef.style.background = 'red';
      // alert("Please enter a valid number with only one decimal place");
    }
    if(Number(elementRef.value) > 400){
      elementRef.style.background = 'red';
      alert("Rainfall is greater than 400mm");
    } else {
      elementRef.style.background = '';
    }
  }
  selectedStations: number[] = [];

  toggleSelection(station: any) {
    if (station.selected) {
      this.selectedStations.push(Number(station.stationid));
    } else {
      this.selectedStations = this.selectedStations.filter((id:any) => id !== Number(station.stationid));
    }
  }

  async Verifyall() {

    if (this.dataToDisplay.length > 0) {
      if (confirm("Do you want to verify these stations?") === true) {
        const filterStationIds = this.dataToDisplay.map((x: any) => {
          return  Number(x.stationid);
        });
        const data = 
          {
            "date" :this.selectedDate,
            "station_ids" : filterStationIds,
            "userid" : +this.currentUserType
        }

        console.log(data)
        try {
          this.isLoading = true;
          const res = this.verificationhq.verifyAll(data).subscribe(async ()=>{
            alert("Verified Successfully");
            this.backend();
            this.filterByDate();
  
            for (let i = 0; i < this.dataToDisplay.length; i++) {
              this.dataToDisplay[i]['status'] = 'Verified';
            }
          });

        } catch (err) {
          console.error(err);
        } finally {
          this.isLoading = false;
        }
      }
    }
  }


  async updateRainfallValueData(stationid: any, rainfall: any, serialNo: any) {
    this.isLoading = true;
    const data = { "station_code": +stationid, "date": this.selectedDate, "value": +rainfall };
    try {
      await this.dataEntryService.updateRainfallValue(data).toPromise();

      // Update fetcheddata in-place — no full page rebuild
      const idx = this.fetcheddata.findIndex((s: any) => +s.station_code === +stationid);
      if (idx !== -1) this.fetcheddata[idx].data = +rainfall;

      // Refresh only the top summary counts
      this.filterByDate();

      // Update only the edited row's status in the bottom table
      const row = this.dataToDisplay.find((s: any) => +s.stationid === +stationid);
      if (row) {
        row.rainfall = +rainfall;
        const src = idx !== -1 ? this.fetcheddata[idx] : null;
        if (+rainfall === -999.9) {
          row.status = 'Not Updated';
        } else if (src?.is_verified === 1) {
          row.status = 'Verified';
        } else {
          row.status = 'Updated';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }



  SortOrder = false;
  sort(list: any[], key: string) {
    this.SortOrder = !this.SortOrder;
    return list.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      if (typeof valueA === "number" && typeof valueB === "number") {
        return this.SortOrder === false ? valueA - valueB : valueB - valueA;
      } else if (typeof valueA === "string" && typeof valueB === "string") {
        return this.SortOrder === false ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        throw new Error("Cannot sort by key: values are not of the same type or unsupported type.");
      }
    }); 
  }

  submit(type: string) {
    this.typeSubmit = type;

    this.showIsUpdatesTable = false;
    this.showIsNotUpdatesTable = false;
    this.showIsVerifiedTable = false;
    this.showIsNotVerifiedTable = false;
    this.dataToDisplay = [];

    if(type == 'isUpdated'){
      this.onIsUpdatedSubmit();
    }
    if(type == 'isVerified'){
      this.onIsVerifiedSubmit();
    }
    if(type == 'isNotVerified'){
      this.onIsNotVerifiedSubmit();
    }
    if(type == 'isNotUpdated'){
      this.onIsNotUpdatedSubmit();
    }

    this.showIsUpdatesTable = type === 'isUpdated';
    this.showIsNotUpdatesTable = type === 'isNotUpdated';
    this.showIsVerifiedTable = type === 'isVerified';
    this.showIsNotVerifiedTable = type === 'isNotVerified';
    this.showTotalStationsTable = type === 'totalStations';

    if (type === 'totalStations') this.onTotalStationsSubmit();

    this.bottom_section = true;
  }

  onIsUpdatedSubmit() {
    let index = 1;
    for(let i = 0; i < this.fetcheddata.length; i++){
      if(this.fetcheddata[i].data != -999.9){
        const temprecord = {
          'SNo': index++,
          'district' : this.fetcheddata[i].district_name, 
          'stationname' : this.fetcheddata[i].station_name, 
          'stationid' : this.fetcheddata[i].station_code, 
          'rainfall' : this.fetcheddata[i].data,
          'status' : 'Updated' 
        };
        this.dataToDisplay.push(temprecord);
      }
    }
    console.log('datatodisplay', this.dataToDisplay);
  }

  onIsNotUpdatedSubmit() {
    this.isVerifactionButtonClicked = true
    let index = 1;
    for(let i = 0; i < this.fetcheddata.length; i++){
      if(this.fetcheddata[i].data == -999.9){
        const temprecord = {
          'SNo': index++,
          'district' : this.fetcheddata[i].district_name, 
          'stationname' : this.fetcheddata[i].station_name, 
          'stationid' : this.fetcheddata[i].station_code, 
          'rainfall' : this.fetcheddata[i].data,
          'status' : 'Not Updated' 
        };
        this.dataToDisplay.push(temprecord);
      }
    }
    this.isVerifactionButtonClicked = false

    console.log('datatodisplay', this.dataToDisplay);
  }

  onIsVerifiedSubmit() {

    let index = 1;
    for(let i = 0; i < this.fetcheddata.length; i++){
      if(this.fetcheddata[i].is_verified==1 && this.fetcheddata[i].data!=-999.9){

        const temprecord = {
          'SNo': index++,
          'district' : this.fetcheddata[i].district_name, 
          'stationname' : this.fetcheddata[i].station_name, 
          'stationid' : this.fetcheddata[i].station_code, 
          'rainfall' : this.fetcheddata[i].data,
          'verifiedTime' : this.formatDate(new Date(this.fetcheddata[i].verified_at)),
          'status' : 'Verified' 
        };
        this.dataToDisplay.push(temprecord);
      }
    }
  }    

  // onIsNotVerifiedSubmit() {

  //   let index = 1;
  //   for(let i = 0; i < this.fetcheddata.length; i++){
  //     if(this.fetcheddata[i].is_verified==0 && this.fetcheddata[i].data!=-999.9){
  //       const temprecord = {
  //         'SNo': index++,
  //         'district' : this.fetcheddata[i].district_name, 
  //         'stationname' : this.fetcheddata[i].station_name, 
  //         'stationid' : this.fetcheddata[i].station_code, 
  //         'rainfall' : this.fetcheddata[i].data,
  //         'verifiedTime' : this.formatDate(new Date(this.fetcheddata[i].verified_at)),
  //         'status' : 'Not Verified'
  //       };
  //       this.dataToDisplay.push(temprecord);
  //     }
  //   }
  // }




  onIsNotVerifiedSubmit(){
    const MCorRMCName = this.currentMCorRMC
    let index=1
    for(let i=0; i<this.fetcheddata.length; i++){
      console.log('this.fetcheddata[i].station_code', typeof this.fetcheddata[i].station_code, this.fetcheddata[i].station_code)
      console.log('devationStatus', this.devationStatus)
      const currentMcOrRmc = this.fetcheddata[i]['centre_type']+' '+this.fetcheddata[i]['centre_name']
      if(currentMcOrRmc==MCorRMCName){
        if(this.fetcheddata[i].is_verified==0 && this.fetcheddata[i].data!=-999.9){
          const temprecord = {
            'SNo': index++,
            'district' : this.fetcheddata[i].district_name, 
            'stationname' : this.fetcheddata[i].station_name, 
            'stationid' : this.fetcheddata[i].station_code, 
            'rainfall' : this.fetcheddata[i].data,
            'verifiedTime' : this.fetcheddata[i].verified_at,
            // 'devation_status' : this.devationStatus[this.fetcheddata[i].station_code].deviation_status,
            'status' : 'Not Verified'
        }
        this.dataToDisplay.push(temprecord);
        }
      }
    }
  }


  onTotalStationsSubmit() {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const isUpdated = this.fetcheddata[i].data !== -999.9;
      const isVerified = isUpdated && this.fetcheddata[i].is_verified === 1;
      this.dataToDisplay.push({
        SNo: index++,
        district: this.fetcheddata[i].district_name,
        stationname: this.fetcheddata[i].station_name,
        stationid: this.fetcheddata[i].station_code,
        rainfall: this.fetcheddata[i].data,
        status: !isUpdated ? 'Not Updated' : isVerified ? 'Verified' : 'Updated'
      });
    }
  }

  resetRainfallInTotal(station: any) {
    station.rainfall = -999.9;
    this.updateRainfallValueData(station.stationid, -999.9, station.SNo);
  }

  fetchDeviationStatus(): Promise<void> {
    this.isLoadingVerificatiion = true
    return new Promise((resolve) => {
      this.isVerificationLoading = true;
      console.log("fetchDeviationStatus called")
        const date = this.selectedDate;
        this.verificationhq.fetchStationDataIncludingVerification(date).subscribe((response) => {
            console.log('fetchStationDataIncludingVerification', response.data);

            this.devationStatus = response.data.reduce((acc: any, item: any) => {
                acc[item.source_station] = { deviation_status: item.deviation_status };
                return acc;
            }, {} as Record<string, any>);

            console.log('Deviation Map:', this.devationStatus);
            resolve();

            this.isVerificationLoading = false;
            this.isVerifiactionButtonClicked = false;
            this.isLoadingVerificatiion = false
        });
    });
}
}
