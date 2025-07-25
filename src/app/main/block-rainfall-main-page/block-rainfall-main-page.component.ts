import { Component } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-block-rainfall-main-page',
  templateUrl: './block-rainfall-main-page.component.html',
  styleUrls: ['./block-rainfall-main-page.component.css']
})
export class BlockRainfallMainPageComponent {


  previousWeekWeeklyStartDate: any;
  previousWeekWeeklyendDate: any;
  loggedInUserObject : any;
  selecteddatamode : any
  
 constructor(
    private dataService: DataService,

  ) {

    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUserObject = JSON.parse(loggedInUser);


    this.dataService.fromAndToDate$.subscribe((value) => {
      if (value) {
        let fromAndToDates = JSON.parse(value);
        this.previousWeekWeeklyStartDate = fromAndToDates.fromDate;
        // console.log(this.previousWeekWeeklyStartDate, 'previousWeekWeeklyStartDate');
        this.previousWeekWeeklyendDate = fromAndToDates.toDate;
        console.log(this.previousWeekWeeklyStartDate, this.previousWeekWeeklyendDate)
      }
    });


    this.dataService.selectdatamode$.subscribe((value)=>{
      if(value){
        let mode = JSON.parse(value)
        this.selecteddatamode = mode.selecteddatamode
      }
    })
 }
}
