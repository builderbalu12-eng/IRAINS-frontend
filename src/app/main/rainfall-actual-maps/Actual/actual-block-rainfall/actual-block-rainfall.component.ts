import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-draw';
import { DatePipe } from '@angular/common';
import { MatMenuTrigger } from '@angular/material/menu';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { DataService } from 'src/app/data.service';
import { getRegionService } from 'src/app/services/region/getregion.service';
import { CenterService } from 'src/app/services/centre/centre.service';
import { getStateService } from 'src/app/services/state/getState.service';
import { getDistrictService } from 'src/app/services/district/getdistrict.service';
import { FetchStationDataService } from 'src/app/services/station/station.service';
import { EMPTY, concatMap, lastValueFrom, of, takeWhile } from 'rxjs';
import { Constants } from 'src/app/services/constants';
import { color } from 'highcharts';
import Exporting from 'highcharts/modules/exporting';
import FullScreen from 'highcharts/modules/full-screen';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-actual-block-rainfall',
  templateUrl: './actual-block-rainfall.component.html',
  styleUrls: ['./actual-block-rainfall.component.css']
})
export class ActualBlockRainfallComponent implements OnInit, OnDestroy {
  // Existing properties (unchanged)
  currDate: any = new Date();
  selectedRegion: any[] = [];
  currentUserType: any;
  loggedInUserObject: any;
  currentUserName: any;
  currentUserMcCategory: any;
  regions: any[] = [];
  regionName: any;
  selectedMC: any;
  centersMC1: any[] = [];
  mcDisabled: boolean = false;
  rmcDisabled: boolean = false;
  selectedRMC: any;
  centersRMC1: any[] = [];
  selectedState: any;
  filterStates: any;
  filterDistrict: any;
  centersMC: any[] = [];
  centersRMC: any[] = [];
  selectedMCData: any[] = [];
  states: any[] = [];
  selectedStateData: any[] = [];
  districts: any[] = [];
  selectedDistrictData: any[] = [];
  isLoading: boolean = false;
  stationData: any;
  filteredStations: any[] = [];
  comparefilteredStations: any[] = [];
  selectedStation: any;
  comparingselectedStations: any;
  selectedDistrict: any;
  selectedstations: any[] = [];
  filteredData: any;
  isAwsSelected: boolean = true;
  isOrgSelected: boolean = true;
  isArgSelected: boolean = true;
  dayStatistics: any = {
    veryLightRainFallStations: { count: 0, isVeryLightRainFall: true },
    lightRainfallStations: { count: 0, isLightRainfall: true },
    modrateRainFallStations: { count: 0, isModrateRainFall: true },
    heavyRainFallStations: { count: 0, isHeavyRainFall: true },
    veryHeavyRainfallStations: { count: 0, isVeryHeavyRainfall: true },
    extremelyHeavyRainfallStations: { count: 0, isExtremelyHeavyRainfall: true },
    zeroRainfallStations: { count: 0, isZeroStations: true }
  };
  maxStationRainfall: any = 0;
  minStationRainfall: any = 0;
  TotalStationsRecieved: any = 0;
  TotalStationsPending: any = 0;
  seriesDailyData: any[] = [];
  showSelectedStation: any = "";
  seriesHistoricalData: any[] = [];
  StationTotalEntries: any = "";
  StationsMissingEntries: any = "";
  StationHighestRecord: any = "";
  StationFirstDate: any = "";
  toCompareStationCircleLayer: any;
  isloadingSurrondingStations: any = false;
  showStationDetails: boolean = false;
  showCompareData: boolean = false;
  showStatistics: boolean = false;
  showFirstMap: boolean = true;
  showSecondMap: boolean = false;
  stationType: any;
  selectedRMCData: any;
  markers: any[] = [];
  StationLowestRecord: any;
  showChart: boolean = true;
  stationWeatherParametersnew = [{ text: "Daily Data" }];
  stationWeatherParametersCompareChartsnew = [{ text: "Daily Data" }];
  showSelectedStationCode: any;
  DatabaseRecordedStartDate: any = "01-01-2024";
  maxSeasonalStationRainfall: any;
  minSeasonalStationRainfall: any;
  TotalStationsRecievedSeasonal: any;
  TotalStationsPendingSeasonal: any;
  maxSeasonalStationname: any;
  maxStationname: any;
  maxRecordedDataDateofSelectedStation: any;
  showSelectedStationObject: any;
  maxStationStatename: any;
  showSelectedState_name: any;
  currSeasonStartDate: any;
  currentSeasonEndDate: any;
  compareBUttonClickedForTestPuporse: any = false;
  selectedRadius: any = 50;
  stationInsidethePolygon: any;
  topN: number = 5;
  topnStations: any[] = [];
  topNstationsloader: boolean = true;
  selectedRegions: string[] = [];
  selectedStates: string[] = [];
  selectedMcs: string[] = [];
  tempfilteredStations: any[] = [];
  regionList: any[] = [];
  filteredMcs: any[] = [];
  filteredStates: any[] = [];
  filteredDistricts: any[] = [];
  totalstations: number = 0;
  notreceivedata: number = 0;
  receivedata: number = 0;
  pendingdata: number = 0;
  highestrecorded: number = 0;
  lowestrecorded: number = 0;
  loading = false;
  private stationObservationMap: any;
  type: any = "rainfall";
  countryList: any;
  levelList: any;
  sourceList: any;
  parameterList: any[] = [];
  categoryList: any;
  thresholdList: any[] = [];
  currentHeavyThreshold: any | null = null;
  currentExtremeThreshold: any | null = null;
  weatherDataList: any[] = [];
  displayedWeatherDataListColumns: string[] = ["date", "max", "avg", "min"];
  selectedLevel: any;
  shapeFilePath: any = "";
  selectedSource: any;
  parameterId: any = 1;
  alertCategoryId: any = 1;
  parameterName = "rf";
  selectedWeatherParameterDetails: any | null = null;
  form: FormGroup = new FormGroup({});
  admEn: any;
  admPcode: any;
  sources: any;
  levels: any;
  dataTypeSlider: boolean = false;
  zoom_level: any = 7;
  defaultDataSourceDetails!: any;
  defaultLevelDetails!: any;
  endTime: any;
  arrowRotation = 0;
  existingstationdata: any[] = [];
  chart: any;
  chartCompare: any;
  selectedOption: string = "station_details";
  selectedParameter: any;
  selectedCategory: any;
  selected_Date: any = this.formatDate(new Date());
  current_Date: any;
  manual_date_time: any;
  isSideNavOpen: boolean = true;
  isBottomNavOpen: boolean = false;
  selectedWeatherOption: string = "Temperature";
  selectedWeatherOptionForCompareCharts = "Temperature";
  mcdata = [
    { id: 101, name: "mc1" },
    { id: 101, name: "mc1" },
    { id: 101, name: "mc1" },
    { id: 101, name: "mc1" },
    { id: 101, name: "mc1" },
  ];
  startNumber: number = 1;
  isDraggingEnabled = false;
  isPlottingEnabled: boolean = false;
  private drawnCoordinates: any[] = [];
  circleMarkers = [];
  compareCircle: any;
  stationsRadisuDataToDisplay: any = [];
  selectedLatitute: any;
  selectedLongitute: any;
  selectAllChecked = false;
  stationsToBeDisplayedIncharts: Array<{
    station_name: string;
    state_name: string;
    distance: number;
    data: any;
    selected?: boolean;
  }> = [];
  userNotes = '';
  notesExpanded = false;
  additionalTableData = [
    { detail: 'Temperature', value: '30°C' },
    { detail: 'Humidity', value: '60%' },
    { detail: 'Pressure', value: '1015 hPa' }
  ];
  ischartInLoading: any = false;
  layerControl: L.Control.Layers | undefined;
  currentLayer: any;
  osmLayer: any;
  openTopoMap: any;
  osmHot: any;
  usgsNationalMap: any;
  currentGeoJSONLayer: any;

  constructor(
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private dataService: DataService,
    private http: HttpClient,
    private regionService: getRegionService,
    private centerService: CenterService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private fetchStationDataService: FetchStationDataService,
    private constants: Constants
  ) {
    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUserObject = JSON.parse(loggedInUser);
    this.currentUserType = this.loggedInUserObject.data[0].mcorhq;
    this.currentUserName = this.loggedInUserObject.data[0].name.replace(/^\S+\s/, "");
    this.currentUserMcCategory = this.loggedInUserObject.data[0].name.split(' ')[0].toLowerCase();
  }

  @ViewChild("timeMenuTrigger") trigger: MatMenuTrigger | undefined;

  private initStationObservationMap(): void {
    console.log('Initializing map...');
    try {
      // Initialize map
      this.stationObservationMap = L.map('map_observations', {
        center: [23, 89.9629],
        zoom: 5.2,
        zoomControl: true,
        scrollWheelZoom: true,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        minZoom: 5,
        dragging: this.isDraggingEnabled
      });
      console.log('Map initialized:', this.stationObservationMap);

      // Define tile layers
      this.osmLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }
      );

      this.openTopoMap = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          maxZoom: 17
        }
      );

      this.osmHot = L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>',
          maxZoom: 19
        }
      );

      this.usgsNationalMap = L.tileLayer(
        'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles courtesy of <a href="https://www.usgs.gov/">USGS</a>',
          maxZoom: 16
        }
      );

      // Add default layer
      this.switchLayer(this.usgsNationalMap);
      console.log('Default layer (OpenStreetMap HOT) added');

      // Define base layers for layer control
      const baseLayers = {
        'OpenStreetMap': this.osmLayer,
        'OpenTopoMap': this.openTopoMap,
        'OpenStreetMap HOT': this.osmHot,
        'USGS National Map': this.usgsNationalMap
      };

      // Add layer control
      this.layerControl = L.control.layers(baseLayers);
      this.layerControl.addTo(this.stationObservationMap);
      console.log('Layer control added:', this.layerControl);

      // Force layer control to expand initially
      setTimeout(() => {
        if (this.layerControl) {
          this.layerControl.expand();
          console.log('Layer control expanded');
        }
      }, 500);

      // Add draw control
      const drawnItems = new L.FeatureGroup();
      this.stationObservationMap.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems, remove: true },
        draw: { polyline: false, rectangle: false, circle: false, marker: false }
      });
      // this.stationObservationMap.addControl(drawControl);
      console.log('Draw control added');

      // Handle polygon creation
      this.stationObservationMap.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        let coordinates = layer.getLatLngs()[0];
        if (coordinates.length > 0) {
          const firstCoord = coordinates[0];
          const lastCoord = coordinates[coordinates.length - 1];
          if (firstCoord.lat !== lastCoord.lat || firstCoord.lng !== lastCoord.lng) {
            coordinates.push(firstCoord);
          }
          const polygon = turf.polygon([coordinates.map((coord: any) => [coord.lng, coord.lat])]);
          const stationsInside = this.stationData.filter((station: any) => {
            const lon = parseFloat(station.longitude);
            const lat = parseFloat(station.latitude);
            if (isNaN(lon) || isNaN(lat)) {
              console.warn('Invalid station coordinates:', station);
              return false;
            }
            const point = turf.point([lon, lat]);
            return turf.booleanPointInPolygon(point, polygon);
          });
          this.stationInsidethePolygon = stationsInside;
          console.log('Stations inside polygon:', stationsInside);
        }
        drawnItems.addLayer(layer);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private switchLayer(newLayer: L.Layer): void {
    if (this.stationObservationMap && newLayer) {
      if (this.currentLayer && this.stationObservationMap.hasLayer(this.currentLayer)) {
        this.stationObservationMap.removeLayer(this.currentLayer);
        console.log('Removed current layer');
      }
      this.stationObservationMap.addLayer(newLayer);
      this.currentLayer = newLayer;
      this.updateLayerControl();
      console.log('Added new layer:', newLayer);
    } else {
      console.warn('Map or new layer not defined');
    }
  }

  private updateLayerControl(): void {
    if (!this.stationObservationMap || !this.layerControl || !this.currentLayer) {
      console.warn('Cannot update layer control: map, layer control, or current layer not initialized');
      return;
    }

    const baseLayers = {
      'OpenStreetMap': this.osmLayer,
      'OpenTopoMap': this.openTopoMap,
      'OpenStreetMap HOT': this.osmHot,
      'USGS National Map': this.usgsNationalMap
    };

    Object.values(baseLayers).forEach((layer) => {
      if (layer !== this.currentLayer && this.stationObservationMap.hasLayer(layer)) {
        this.stationObservationMap.removeLayer(layer);
      }
    });

    if (!this.stationObservationMap.hasLayer(this.currentLayer)) {
      this.stationObservationMap.addLayer(this.currentLayer);
    }

    this.layerControl.remove();
    this.layerControl = L.control.layers(baseLayers);
    this.layerControl.addTo(this.stationObservationMap);
    this.layerControl.expand();
    console.log('Layer control rebuilt and synced with current layer:', this.currentLayer);
  }

  toggleLayerControl(): void {
    if (this.layerControl) {
      const controlElement = document.querySelector('.leaflet-control-layers');
      if (controlElement) {
        const isExpanded = controlElement.classList.contains('leaflet-control-layers-expanded');
        if (isExpanded) {
          this.layerControl.collapse();
          console.log('Layer control collapsed');
        } else {
          this.layerControl.expand();
          console.log('Layer control expanded');
        }
      } else {
        console.warn('Layer control element not found in DOM');
      }
    } else {
      console.warn('Layer control not initialized');
    }
  }

  debugLayerControl(): void {
    console.log('Debugging layer control...');
    console.log('Layer control object:', this.layerControl);
    console.log('Map object:', this.stationObservationMap);
    console.log('Current layer:', this.currentLayer);
    const controlElement = document.querySelector('.leaflet-control-layers');
    if (controlElement) {
      console.log('Layer control element found:', controlElement);
      console.log('Element styles:', window.getComputedStyle(controlElement));
    } else {
      console.warn('Layer control element not found in DOM');
    }
    if (this.layerControl) {
      this.layerControl.expand();
      console.log('Layer control forcibly expanded');
    }
  }

  switchToOpenStreetMap(): void {
    this.switchLayer(this.osmLayer);
  }

  switchToopenTopoMap(): void {
    this.switchLayer(this.openTopoMap);
  }
  switchToosmHotMap(): void {
    this.switchLayer(this.osmHot);
  }
    switchTousgsNationalMap(): void {
    this.switchLayer(this.usgsNationalMap);
  }
  switchToNoLayerMap(): void {
    this.stationObservationMap.removeLayer(this.currentLayer);  
  }



 

  // Existing methods (unchanged)
  Start() {
    const getCSSVal = (e: any, v: any) => e.style.getPropertyValue(v);
    const mod = (n: any, m: any) => ((n % m) + m) % m;
    const PI = Math.PI;
    const TAU = PI * 2;

    const radar = (elRadar: any) => {
      const elBeam = elRadar.querySelector(".beam");
      const elsDot = elRadar.querySelectorAll(".dot");

      const update = () => {
        const beamAngle =
          (parseFloat(getComputedStyle(elBeam).getPropertyValue("rotate")) * PI) / 180 || 0;

        elsDot.forEach((elDot: any) => {
          const x = getCSSVal(elDot, "--x") - 0.5;
          const y = getCSSVal(elDot, "--y") - 0.5;
          const dotAngle = mod(Math.atan2(y, x), TAU);
          const opacity = mod(dotAngle - beamAngle, TAU) / TAU;
          elDot.style.opacity = opacity;
        });

        requestAnimationFrame(update);
      };

      update();
    };

    document.querySelectorAll(".radar").forEach(radar);
  }

  async ngOnInit(): Promise<void> {
    this.Start();
    this.form = this.formBuilder.group({
      level: [0, Validators.required],
      source: [0, Validators.required],
    });

    this.initStationObservationMap();
    this.getCurrentDate();
    this.loadGeoJSON();
    this.fetchStationData(this.selected_Date);
    this.fetchSeasonalStationData(this.selected_Date);
    this.fetchRegionData();
    await this.getAllMCData();
    await this.getAllRMCData();
    this.getAllStates();
    this.getAllDistricts();

    Exporting(Highcharts);
    FullScreen(Highcharts);
  }

  getCurrentDate() {
    const date = new Date();
    const curr_Date = this.datePipe.transform(date, "d MMM yyyy, h:mm a");
    if (curr_Date) {
      const [formattedDate, formattedTime]: string[] = curr_Date.split(", ");
      this.current_Date = {
        date: formattedDate,
        time: formattedTime,
      };
    }
  }

  onChangeRegion(checkedValues: any) {
    this.selectedRegions = checkedValues;
    let tempMcs = this.existingstationdata.filter((item) => {
      return checkedValues.some((value: any) => {
        return item.region == value;
      });
    });
    let tempfilteredMcs = Array.from(new Set(tempMcs.map((a) => a.rmc_mc)));
    this.filteredMcs = tempfilteredMcs.map((a) => {
      return { name: a };
    });
  }

  onChangeMc(checkedValues: any) {
    this.selectedMcs = checkedValues;
    let tempStates = this.existingstationdata.filter((item) => {
      return checkedValues.some((value: any) => {
        return item.rmc_mc == value;
      });
    });
    let tempfilteredStates = Array.from(new Set(tempStates.map((a) => a.state)));
    this.filteredStates = tempfilteredStates.map((a) => {
      return { name: a };
    });
  }

  onChangeState(checkedValues: any) {
    let tempDistricts = this.existingstationdata.filter((item) => {
      return checkedValues.some((value: any) => {
        return item.state == value;
      });
    });
    let tempfilteredDistricts = Array.from(new Set(tempDistricts.map((a) => a.district)));
    this.filteredDistricts = tempfilteredDistricts.map((a) => {
      return { name: a };
    });
    this.selectedDistrict = "";
  }

  onChangeDistrict(checkedValues: any) {
    let tempStations = this.existingstationdata.filter((item) => {
      return checkedValues.some((value: any) => {
        return item.district == value;
      });
    });
    let tempfilteredStations = Array.from(new Set(tempStations.map((a) => a.station)));
    this.filteredStations = tempfilteredStations.map((a) => {
      return { name: a };
    });
    this.selectedStation = "";
  }

  ngOnDestroy(): void {
    this.stationObservationMap.remove();
  }

  get formControls() {
    return this.form.controls;
  }

  changeDate() {
    this.manual_date_time = this.formatDate(this.selected_Date);
  }

  changeTimeToggle(event: any) {
    this.dataTypeSlider = event.checked;
  }

  confirmTimeDate(event: Event): void {
    if (this.trigger) {
      this.trigger.closeMenu();
    }
  }

  formatDate(date: any) {
    const dateObject = new Date(date);
    const year = dateObject.getFullYear();
    const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObject.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  selectParameter(parameterObj: any) {
    this.selectedParameter = parameterObj;
    this.selectCategory(parameterObj.categoryOptions[0].text);
  }

  selectCategory(category: String) {
    this.selectedCategory = category;
  }

  toggleBottomNav() {
    this.isBottomNavOpen = true;
  }

  dateCalculation() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let newDate = new Date(this.selected_Date);
    let dd = String(newDate.getDate());
    const year = newDate.getFullYear();
    const currmonth = months[newDate.getMonth()];
    const selectedYear = String(year).slice(-2);
    return `${dd.padStart(2, "0")}_${currmonth}_${selectedYear}`;
  }

  toggleMapDisplay(): void {
    this.showFirstMap = !this.showFirstMap;
    this.showSecondMap = !this.showSecondMap;
    if (this.showFirstMap) {
      // this.loadGeoJSON();
    } else {
      // this.loadGeoJSON1();
    }
  }

  findMatchingData(id: string): any | null {
    const matchedData = this.filteredStations.find(
      (data: any) => data.district_code == id
    );
    if (matchedData) {
      return matchedData;
    } else {
      return null;
    }
  }

  getColorForRainfall1(rainfall: any): string {
    const numericId = rainfall;
    let cat = "";
    if (numericId == " ") {
      return "#c0c0c0";
    }
    if (numericId > 60) {
      cat = "LE";
      return "#0096ff";
    }
    if (numericId >= 20 && numericId <= 59) {
      cat = "E";
      return "#32c0f8";
    }
    if (numericId >= -19 && numericId <= 19) {
      cat = "N";
      return "#00cd5b";
    }
    if (numericId >= -59 && numericId <= -20) {
      cat = "D";
      return "#ff2700";
    }
    if (numericId >= -99 && numericId <= -60) {
      cat = "LD";
      return "#ffff20";
    }
    if (numericId == -100) {
      cat = "NR";
      return "#ffffff";
    } else {
      cat = "ND";
      return "#c0c0c0";
    }
  }

  submitParameterForm() {
    this.toggleBottomNav();
  }

  closePopup() {
    this.isBottomNavOpen = false;
    this.showChart = true;
    if (this.compareCircle) {
      this.stationObservationMap.removeLayer(this.compareCircle);
    }
  }

  selectStationDataOption(option: string): void {
    this.selectedOption = option;
  }

  updateChart(weatherOptions: any) {
    if (this.selectedOption === "station_details") {
      var hoursArray;
      var valuesArray;

      hoursArray = weatherOptions.hourWisedata.map(
        (dataPoint: any) => dataPoint.hour
      );
      valuesArray = weatherOptions.hourWisedata.map(
        (dataPoint: any) => dataPoint.value
      );

      const unit = weatherOptions.data[0].unit;
      this.chart = new Chart({
        chart: { type: "line" },
        title: { text: "" },
        credits: { enabled: false },
        xAxis: { categories: hoursArray },
        yAxis: { title: { text: unit } },
        series: [{ type: "line", name: weatherOptions.text, data: valuesArray }],
      });
    } else if (this.selectedOption === "compare_charts") {
      const hoursArray = weatherOptions.data.map(
        (dataPoint: any) => dataPoint.hour
      );
      const valuesArray = weatherOptions.data.map(
        (dataPoint: any) => dataPoint.value
      );
      const valuesArray1 = weatherOptions.data1.map(
        (dataPoint: any) => dataPoint.value
      );
      const unit = weatherOptions.data[0].unit;
      this.chart = new Chart({
        chart: { type: "line" },
        title: { text: "" },
        credits: { enabled: false },
        xAxis: { categories: hoursArray },
        yAxis: { title: { text: unit } },
        series: [
          { type: "line", name: weatherOptions.text, data: valuesArray },
          { type: "line", name: weatherOptions.text + " 1", data: valuesArray1 },
        ],
      });
      this.selectedWeatherOption = weatherOptions.text;
    }
  }

  toggleDataParameter(param: string) {
    return param === this.selectedWeatherOption;
  }

  toggleDataParameterCompareCharts(param: string) {
    return param === this.selectedWeatherOptionForCompareCharts;
  }

  async fetchSeasonalStationData(date: any) {
    const fromAndTodate = this.constants.getCurrentMonthSeasonFromAndToCurrentDate(new Date(date));
    this.currSeasonStartDate = fromAndTodate.startDate;
    this.currentSeasonEndDate = fromAndTodate.endDate;

    const param = {
      fromDate: fromAndTodate.startDate,
      toDate: fromAndTodate.endDate,
    };

    try {
      const response = await this.fetchStationDataService
        .fetchInRangeStationdata(fromAndTodate.startDate, fromAndTodate.endDate)
        .toPromise();
      const fetchedData = response.data;

      const initialResult = {
        maxStation: fetchedData[0],
        minStation: fetchedData[0],
        validCount: 0,
        invalidCount: 0,
      };

      const result = fetchedData.reduce((acc: any, station: any) => {
        if (station.data !== -999.9 && station.data !== 0) {
          if (!acc.maxStation || station.data > acc.maxStation.data) {
            acc.maxStation = station;
          }
          if (!acc.minStation || station.data < acc.minStation.data) {
            acc.minStation = station;
          }
          acc.validCount++;
        } else {
          acc.invalidCount++;
        }
        return acc;
      }, initialResult);

      this.maxSeasonalStationRainfall =
        result.maxStation.data == -999.9
          ? "No Data"
          : result.maxStation.data.toFixed(1) + "mm";
      this.maxSeasonalStationname = result.maxStation.station_name;
      this.minSeasonalStationRainfall =
        result.minStation.data == -999.9
          ? "No Data"
          : result.minStation.data + "mm";
      this.TotalStationsRecievedSeasonal = result.validCount;
      this.TotalStationsPendingSeasonal = result.invalidCount;
    } catch (e) {
      console.log(e);
    }
  }

  fetchStationData(date: any): void {
    this.isLoading = true;
    try {
      this.fetchStationDataService.fetchStationDataTemp(date ?? "").subscribe(
        (response: any) => {
          this.stationData = response?.data;
          const initialResult = {
            maxStation: this.stationData[0],
            minStation: this.stationData[0],
            validCount: 0,
            invalidCount: 0,
          };
          const result = this.stationData.reduce((acc: any, station: any) => {
            if (station.data !== -999.9) {
              if (!acc.maxStation || station.data > acc.maxStation.data) {
                acc.maxStation = station;
              }
              if (!acc.minStation || station.data < acc.minStation.data) {
                acc.minStation = station;
              }
              acc.validCount++;
            } else {
              acc.invalidCount++;
            }
            return acc;
          }, initialResult);

          this.maxStationRainfall =
            result.maxStation.data == -999.9
              ? "No Data"
              : result.maxStation.data + "mm";
          this.maxStationname = result.maxStation.station_name;
          this.maxStationStatename = result.maxStation.state_name;
          this.minStationRainfall =
            result.minStation.data == -999.9
              ? "No Data"
              : result.minStation.data + "mm";
          this.TotalStationsRecieved = result.validCount;
          this.TotalStationsPending = result.invalidCount;

          this.comparefilteredStations = this.stationData;
          this.filteredData = this.stationData;
          this.getDayStatistics();
          this.isLoading = false;
        },
        (error: any) => {
          this.isLoading = false;
          alert('Data not found for the selected date');
          console.error("Error fetching data:", error);
        }
      );
    } catch {
      this.isLoading = false;
    }
  }

  fetchRegionData() {
    this.regionService.fetchData().subscribe(
      (response) => {
        if (response && response.data) {
          this.regions = response.data.map((region: any) => ({
            label: region.region_name,
            value: region.region_code,
          }));
        } else {
          console.error("Unexpected response format:", response);
          alert("Data is not coming in the expected format");
        }
      },
      (error) => {
        console.error("Error fetching region data:", error);
        alert("Data is not available for today");
      }
    );
  }

  async getAllMCData(): Promise<void> {
    try {
      const response = await this.centerService.fetchData("MC").toPromise();
      this.centersMC.push(response.data);
    } catch (error) {
      console.error("Error fetching center details:", error);
    }
  }

  async getAllRMCData(): Promise<void> {
    try {
      const response = await this.centerService.fetchData("RMC").toPromise();
      this.centersRMC.push(response.data);
    } catch (error) {
      console.error("Error fetching center details:", error);
    }
  }

  getAllStates(): void {
    console.log('get all states', this.currentUserType)
    this.getStateService.fetchData().subscribe(
      (response) => {
        this.states.push(response);
        if (this.currentUserType == 'mc') {
          if (this.currentUserMcCategory == 'mc') {
            this.rmcDisabled = true;
            this.selectedMC = this.centersMC[0].filter((x: any) => x.centre_name.toLowerCase() == this.currentUserName.toLowerCase());
            const filteredStates = this.states[0].data.filter((state: any) => {
              return this.selectedMC.some(
                (mc: any) => mc.centre_name == state.centre_name
              );
            });
            this.filterStates = filteredStates;
          } else {
            this.mcDisabled = true;
            this.selectedRMC = this.centersRMC[0].filter((x: any) => x.centre_name.toLowerCase() == this.currentUserName.toLowerCase());
            const filterStatesRMC = this.states[0].data.filter((state: any) => {
              return this.selectedRMC.some(
                (rmc: any) => rmc.centre_name == state.centre_name
              );
            });
            this.filterStates = filterStatesRMC;
          }
        }
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  getAllDistricts(): void {
    this.getDistrictService.fetchData().subscribe(
      (response) => {
        this.districts.push(response);
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  onRegionChange(): void {
    if (this.selectedRegion && this.selectedRegion.length > 0) {
      const filteredCenters = this.centersMC[0]?.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      this.centersMC.push(filteredCenters);
      let lenOfCenterMC = this.centersMC.length;
      this.centersMC1 = this.centersMC[lenOfCenterMC - 1];

      const filteredCentersRMC = this.centersRMC[0]?.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      this.centersRMC.push(filteredCentersRMC);
      let lenOfCenterRMC = this.centersRMC.length;
      this.centersRMC1 = this.centersRMC[lenOfCenterRMC - 1];
    }
  }

  onMcChange(event: any): void {
    this.selectedMCData = event.value;
    this.rmcDisabled = this.selectedMC.length > 0;
    const filteredStates = this.states[0].data.filter((state: any) => {
      return this.selectedMC.some(
        (mc: any) => mc.centre_name == state.centre_name
      );
    });
    this.filterStates = filteredStates;
  }

  onRMcChange(event: any): void {
    this.selectedRMCData = event.value;
    this.mcDisabled = this.selectedRMC.length > 0;
    const filterStatesRMC = this.states[0].data.filter((state: any) => {
      return this.selectedRMC.some(
        (rmc: any) => rmc.centre_name == state.centre_name
      );
    });
    this.filterStates = filterStatesRMC;
  }

  onStateChange(event: any): void {
    this.selectedStateData = event.value;
    const filteredDistricts = this.districts[0].data.filter((dist: any) => {
      return this.selectedState.some(
        (mc: any) => mc.state_code == dist.state_code
      );
    });
    this.filterDistrict = filteredDistricts;
  }

  onDistrictChange(event: any): void {
    this.selectedDistrictData = event.value;
    const filteredStations = this.stationData.filter((dist: any) => {
      return this.selectedDistrictData.some(
        (st: any) => dist.district_code == st.district_code
      );
    });
    this.filteredStations = filteredStations;
  }

  onStationChange(event: any): void {
    this.selectedstations = event.value;
  }

  filterStationData(): void {
    this.isLoading = true;
    if (this.selectedstations.length == 0) {
      this.filteredData = this.stationData;
      if (this.selectedRegion && this.selectedRegion.length > 0) {
        this.filteredData = this.filteredData.filter((station: any) =>
          this.selectedRegion.includes(station.region_code)
        );
      }
      if (this.selectedMC && this.selectedMC.length > 0) {
        const selectedMCNames = this.selectedMC.map((mc: any) => mc.centre_name);
        this.filteredData = this.filteredData.filter((station: any) =>
          selectedMCNames.includes(station.centre_name)
        );
      }
      if (this.selectedRMC && this.selectedRMC.length > 0) {
        const selectedRMCNames = this.selectedRMC.map(
          (rmc: any) => rmc.centre_name
        );
        this.filteredData = this.filteredData.filter((station: any) =>
          selectedRMCNames.includes(station.centre_name)
        );
      }
      if (this.selectedStateData && this.selectedStateData.length > 0) {
        const selectedStateCodes = this.selectedStateData.map(
          (state: any) => state.state_code
        );
        this.filteredData = this.filteredData.filter((item: any) =>
          selectedStateCodes.includes(item.state_code)
        );
      }
      if (this.selectedDistrictData && this.selectedDistrictData.length > 0) {
        const selectedDistrictCodes = this.selectedDistrictData.map(
          (item: any) => item.district_code
        );
        this.filteredData = this.filteredData.filter((item: any) =>
          selectedDistrictCodes.includes(item.district_code)
        );
      }
    } else {
      this.filteredData = this.selectedstations;
    }

    this.filteredData = this.filteredData.filter((x: any) => {
      return (
        (this.isAwsSelected && x.station_type === "AWS") ||
        (this.isOrgSelected && x.station_type === "ORG") ||
        (this.isArgSelected && x.station_type === "ARG")
      );
    });

    this.getDayStatistics();

    this.filteredData = this.filteredData.filter((x: any) => {
      const data = x.data;
      return (
        (this.dayStatistics.veryLightRainFallStations.isVeryLightRainFall &&
          data >= 0.1 &&
          data <= 2.4) ||
        (this.dayStatistics.lightRainfallStations.isLightRainfall &&
          data > 2.4 &&
          data <= 15.5) ||
        (this.dayStatistics.modrateRainFallStations.isModrateRainFall &&
          data > 15.5 &&
          data <= 64.4) ||
        (this.dayStatistics.heavyRainFallStations.isHeavyRainFall &&
          data > 64.4 &&
          data <= 115.5) ||
        (this.dayStatistics.veryHeavyRainfallStations.isVeryHeavyRainfall &&
          data > 115.5 &&
          data <= 204.4) ||
        (this.dayStatistics.extremelyHeavyRainfallStations.isExtremelyHeavyRainfall &&
          data > 204.4) ||
        (this.dayStatistics.zeroRainfallStations.isZeroStations &&
          data == 0)
      );
    });

    let cout = 0;
    for (const key in this.dayStatistics) {
      cout = cout + this.dayStatistics[key].count;
    }

    this.isLoading = false;
  }

  getDayStatistics() {
    for (const key in this.dayStatistics) {
      this.dayStatistics[key].count = 0;
    }

    for (let i = 0; i < this.filteredData.length; i++) {
      const data = this.filteredData[i].data;
      if (data == 0) {
        this.dayStatistics.zeroRainfallStations.count++;
        continue;
      }
      if (data >= 0.1 && data <= 2.4) {
        this.dayStatistics.veryLightRainFallStations.count++;
      } else if (data > 2.4 && data <= 15.5) {
        this.dayStatistics.lightRainfallStations.count++;
      } else if (data > 15.5 && data <= 64.4) {
        this.dayStatistics.modrateRainFallStations.count++;
      } else if (data > 64.4 && data <= 115.5) {
        this.dayStatistics.heavyRainFallStations.count++;
      } else if (data > 115.5 && data <= 204.4) {
        this.dayStatistics.veryHeavyRainfallStations.count++;
      } else if (data > 204.4) {
        this.dayStatistics.extremelyHeavyRainfallStations.count++;
      }
    }
  }

  toggleDragging(): void {
    this.isDraggingEnabled = !this.isDraggingEnabled;
    if (this.isDraggingEnabled) {
      this.stationObservationMap.dragging.enable();
    } else {
      this.stationObservationMap.dragging.disable();
    }
  }

  plotArea(): void {
    if (this.stationInsidethePolygon) {
      this.stationsRadisuDataToDisplay = this.stationInsidethePolygon.map((x: any) => {
        return {
          selected: false,
          station_name: x.station_name,
          state_name: x.state_name,
          data: x.data + "mm",
          station_code: x.station_code,
        };
      });
      this.isPlottingEnabled = true;
      console.log("Plotting enabled");
      this.selectedOption = "custom_hand_polygon";
      this.toggleBottomNav();
    } else {
      alert("Select the stations using free hand polygon");
    }
  }

  loadGeoJSON(): void {
    this.http.get("assets/geojson/INDIA_BLOCK.json").subscribe((res: any) => {
      L.geoJSON(res, {
        style: (feature: any) => {
          return {
            weight: 1,
            opacity: 1,
            color: "black",
          };
        },
        onEachFeature: (feature: any, layer: any) => {},
      }).addTo(this.stationObservationMap);
    });
  }


  // loadGeoJSON(url: string, level: string): void {
  //   this.http.get(url).subscribe((geojson: any) => {
  //     this.currentGeoJSONLayer = L.geoJSON(geojson, {
  //       style: {
  //         color: level === 'state' ? '#ff7800' : level === 'district' ? '#00ff00' : '#0000ff',
  //         weight: 2,
  //         opacity: 0.65
  //       }
  //     }).addTo(this.stationObservationMap!);

  //     // Fit map to the bounds of the loaded GeoJSON
  //     this.stationObservationMap!.fitBounds(this.currentGeoJSONLayer.getBounds());
  //   });
  // }

  private getIconForData(data: number): L.Icon {
    let iconUrl = "assets/images/EHR.png";
    if (data == 0) {
      iconUrl = "assets/images/zero rainfall5.png";
    }
    if (data > 0 && data <= 2.4) {
      iconUrl = "assets/images/VLR.png";
    } else if (data > 2.4 && data <= 15.5) {
      iconUrl = "assets/images/LR.png";
    } else if (data > 15.5 && data <= 64.4) {
      iconUrl = "assets/images/MR.png";
    } else if (data > 64.4 && data <= 115.5) {
      iconUrl = "assets/images/HR.png";
    } else if (data > 115.5 && data <= 204.4) {
      iconUrl = "assets/images/VHR.png";
    } else if (data > 204.4) {
      iconUrl = "assets/images/EHR.png";
    }

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [13, 13],
      iconAnchor: [10, 20],
      popupAnchor: [0, -20],
    });
  }

  async updateRadius(): Promise<void> {
    if (this.compareCircle) {
      const radiusInKm = this.selectedRadius;
      const radiusToPass = radiusInKm * 1000;
      this.compareCircle.setRadius(radiusToPass);
      this.isloadingSurrondingStations = true;

      const response = await this.fetchStationDataService
        .fetchStationDataInRadius(
          this.selected_Date,
          this.selectedLatitute,
          this.selectedLongitute,
          radiusInKm
        )
        .toPromise();
      const fetchedData = response.data;

      this.stationsRadisuDataToDisplay = fetchedData.map((x: any) => {
        return {
          selected: false,
          station_name: x.station_name,
          state_name: x.state_name,
          distance: x.distance_km.toFixed(2) + "km",
          data: x.data + "mm",
          station_code: x.station_code,
        };
      });

      this.isloadingSurrondingStations = false;
    }
  }

  toggleSelectAll(event: any) {
    this.selectAllChecked = event.target.checked;
    this.stationsRadisuDataToDisplay.forEach(
      (station: any) => (station.selected = this.selectAllChecked)
    );
  }

  onStationSelectChange(station: any) {
    this.selectAllChecked = this.stationsRadisuDataToDisplay.every(
      (station: any) => station.selected
    );
  }

  onStationSelectChangeInPolygon(stationToSelect: any) {
    this.stationsRadisuDataToDisplay = this.stationsRadisuDataToDisplay.map((station: any) => ({
      ...station,
      selected: station.station_code === stationToSelect.station_code
    }));
  }

  onDateChange(event: any) {
    this.selected_Date = event.target.value;
    this.fetchStationData(this.selected_Date);
  }

  onCompareStationChange(event: any) {
    this.comparingselectedStations = event.value;
  }

  months = Array.from({ length: 12 }, (_, i) => `${i + 1} month(s) ago`);
  selectedMonth: string = "";

  submitHistoricalData() {
    if (this.selectedMonth) {
      console.log("Selected Month:", this.selectedMonth);
    }
  }

  isResizing = false;
  chartHeight: string = "232px";

  onMouseDown(event: MouseEvent): void {
    this.isResizing = true;
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isResizing) {
      const resizableBox = document.querySelector(".resizable-box") as HTMLElement;
      const tableContainer = document.querySelector(".table-container") as HTMLElement;

      const newHeight = window.innerHeight - event.clientY;

      resizableBox.style.height = `${newHeight}px`;

      if (tableContainer) {
        tableContainer.style.maxHeight = `${newHeight - 50}px`;
      }

      this.chartHeight = `${newHeight * 10}px`;

      if (this.chartCompare) {
        this.chartCompare.update({
          chart: {
            height: this.chartHeight,
          },
        });
      }
    }
  }

  onMouseUp(): void {
    this.isResizing = false;
    window.removeEventListener("mousemove", this.onMouseMove.bind(this));
    window.removeEventListener("mouseup", this.onMouseUp.bind(this));
  }

  expandNotes(): void {
    this.notesExpanded = !this.notesExpanded;
    const notesElement = document.querySelector('.notes-container textarea');
    if (notesElement) {
      notesElement.setAttribute('rows', this.notesExpanded ? '5' : '2');
    }
  }

  topNStations(): any {
    this.topNstationsloader = true;
    if (!this.filteredData || !Array.isArray(this.filteredData)) return [];
    this.topnStations = this.filteredData
      .sort((a, b) => b.data - a.data)
      .slice(0, this.topN);
    this.topNstationsloader = false;
  }

  restrictInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (value > 50) {
      input.value = '50';
      this.topN = 50;
    } else if (value < 1 || isNaN(value)) {
      input.value = '1';
      this.topN = 1;
    }
  }

  onTopNChange(newValue: number): void {
    if (newValue >= 1 && newValue <= 50) {
      this.topN = newValue;
    } else {
      this.topN = newValue > 50 ? 50 : 1;
    }
    this.topNStations();
  }

  compareCharts(): void {
    this.selectedOption = "compare_charts";
    this.toggleBottomNav();
    this.showCompareData = true;
  }

  viewStatistics(): void {
    this.showChart = false;
    this.selectedOption = "view_statistics";
    this.toggleBottomNav();
  }

  UpdatePolygonChart(data: string) {
  }

}
