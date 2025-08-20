import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { IndexedDBService } from 'src/app/indexed-db.service';
import { PdfUploadService } from 'src/app/services/pdfUploadService.ts/pdf-upload.service';
import { Constants } from 'src/app/services/constants';
import { routes } from 'src/app/app-routing.module';



@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {
  selectedMapType: any = 'RainfallMaps';

  isNavbarOpen = false;
  loggedInUser: any;
  isLoading : boolean = false
  loading: boolean = false;

  // selectedMode: string = '';
  routeDictionary: any;
  loggedInUserType: any;
  google: any;

  documentTypes: any[] = [];


  hasAccess(route: any) {
    return this.routeDictionary[route]?.allowedUsers?.includes(this.loggedInUserType) || false;
  }
  
  selectBlockOrRainfallMaps(arg0: string) {
    this.selectedMapType = arg0
    if(this.selectedMapType == 'RainfallMaps'){
      this.router.navigate(['/all-maps']);
    } else{ 
      this.router.navigate(['/block-rainfall']);
    }    
}
  

  NavigateToDashboad() {
      this.selectedMapType = "Dashboard"
      this.router.navigate(['irains-dashboard']);
  }

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen;
  }
  showPopup: boolean = false;
  qpfReports: any[] = [];
  rainFallReports: any[] = [];
  designStormReports: any[] = [];

  constructor(
    private router: Router,
    private dataService: DataService,
    private indexedDBService: IndexedDBService,
    private pdfService : PdfUploadService,
    private constants : Constants,

  ) {



    const currentRoute = this.router.url;
    if (currentRoute.includes('/all-maps')) {
      this.selectedMapType = 'RainfallMaps'
    } else if (currentRoute.includes('/block-rainfall')) {
      this.selectedMapType = 'Block'
    } else {
      this.selectedMapType = 'Dashboard'
    }

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000); 



    const filteredRoutes = routes.filter((route: any) => route.data && route.data.allowedUsers);
  
    this.routeDictionary = filteredRoutes.reduce((acc: any, route: any) => {
      acc[route.path] = route.data;
      return acc;
    }, {});

    console.log('this.routeDictionary', this.routeDictionary)


   }


  ngOnInit(): void {
    // const guestData = localStorage.getItem("IsGuestMode");
    // this.isGuest = guestData ? JSON.parse(guestData).IsGuestMode : false; // Parse and assign boolean
  
    // if (this.isGuest) {
    //   this.selectedMode = this.constants.getGuestMode();
    // }




    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUser = JSON.parse(loggedInUser);
    this.loggedInUserType = this.loggedInUser.data[0].mcorhq
    console.log('loggedInUserType nav, loggedInUser', this.loggedInUser, this.loggedInUserType)
    this.loadDocumentTypes();

  }
  private isTranslateInitialized = false;

  showTranslateDropdown(): void {
    const translateDiv = document.getElementById('google_translate_element');
    if (translateDiv) {
      translateDiv.style.display = 'block';
    }

    if (!this.isTranslateInitialized && typeof this.google !== 'undefined' && this.google.translate) {
      this.isTranslateInitialized = true;

      new this.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,ta,te,bn,gu,kn,ml,mr,pa,ur',
        layout: this.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    }

    this.removeTranslateHashImmediately();
  }

  removeTranslateHashImmediately(): void {
    const observer = new MutationObserver(() => {
      if (location.hash.includes('googtrans')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also set up a one-time cleanup
    setTimeout(() => {
      if (location.hash.includes('googtrans')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }, 500);
  }


  downloadPDF(name: string) {
    localStorage.removeItem('weekDates');
    this.dataService.setdownloadPdf(name);
  }

  downloadWeeklyPDF(name: string) {
    this.dataService.setweeklyPdf(name);
    this.weeklyMap();
  }

  goToDailyDepartureMap(name: string) {
    // localStorage.removeItem('weekDates');
    // this.dailyMap();
    if (name == "District") {
      this.router.navigate(['daily-departure-district-map']);
    }
    if (name == "State") {
      this.router.navigate(['daily-departure-state-map']);
    }
    if (name == "SubDivision") {
      this.router.navigate(['daily-departure-subdivision-map']);
    }
    if (name == "Homogenous") {
      this.router.navigate(['daily-departure-homogenous-map']);
    }
    if (name == "Country") {
      this.router.navigate(['daily-departure-country-map']);
    }
  }

  goToDailyMap(name: string) {
    this.dailyMap();
    if (name == "District") {
      this.router.navigate(['daily-district-map']);
    }
    if (name == "State") {
      this.router.navigate(['daily-state-map']);
    }
    if (name == "SubDivision") {
      this.router.navigate(['daily-subdivision-map']);
    }
    if (name == "Homogenous") {
      this.router.navigate(['daily-homogenous-map']);
    }
  }

  goToNormalMap(name: string) {
    this.dailyMap();
    if (name == "District") {
      this.router.navigate(['normal-district-map']);
    }
    if (name == "State") {
      this.router.navigate(['normal-state-map']);
    }
    if (name == "SubDivision") {
      this.router.navigate(['normal-subdivision-map']);
    }
    if (name == "Homogenous") {
      this.router.navigate(['normal-homogenous-map']);
    }
  }

  goToWeeklyMap(name: string) {
    


    localStorage.removeItem('dailyDate');
    this.weeklyMap();
    if (name == "District") {
      this.router.navigate(['daily-departure-district-map']);
    }
    if (name == "State") {
      this.router.navigate(['daily-departure-state-map']);
    }
    if (name == "SubDivision") {
      this.router.navigate(['daily-departure-subdivision-map']);
    }
    if (name == "Homogenous") {
      console.log('Homogenous');
      this.router.navigate(['daily-departure-homogenous-map']);
    }
    if (name == "Country") {
      this.router.navigate(['daily-departure-country-map']);
    }
  }

  dailyMap() {
    let date = new Date();
    var data = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: date.getDate()
    }
    localStorage.setItem('dailyDate', JSON.stringify(data));
  }

  weeklyMap() {
    const previousWeekWeeklyRange = this.getPreviousWeekWeeklyRange();
    let data = {
      previousWeekWeeklyStartDate: previousWeekWeeklyRange.start.toISOString(),
      previousWeekWeeklyEndDate: previousWeekWeeklyRange.end.toISOString()
    }
    localStorage.setItem('weekDates', JSON.stringify(data));
  }

  getPreviousWeekWeeklyRange() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the difference between the current day and Thursday (4)
    const daysUntilThursday = (4 - currentDay + 7) % 7;

    // Calculate the start date (Thursday) and end date (Wednesday) of the previous week
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysUntilThursday - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Calculate the start date (Thursday) and end date (Wednesday) of the week before the previous week
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(startDate.getDate());

    const previousEndDate = new Date(endDate);
    previousEndDate.setDate(endDate.getDate());

    return {
      start: previousStartDate,
      end: previousEndDate,
    };
  }

  uploadPopUp() {
    this.showPopup = true;
  }

  cancel() {
    this.showPopup = false;
  }

  openFile(fileName:any) {
    window.open("assets/" + fileName);
  }

  downloadFile(data:any): void {
    var windo:any = window.open("", "");
    var objbuilder = '';
    objbuilder += ('<embed width=\'100%\' height=\'100%\'  src="data:application/pdf;base64,');
    objbuilder += (data);
    objbuilder += ('" type="application/pdf" />');
    windo.document.write(objbuilder);
    // window.open(`http://localhost:3000/download/${fileId}`, '_blank');
  }

  // sendEmail(){
  //   if (confirm("Do want to send email") == true) {
  //     // let emails = ["saurav97531@gmail.com", "pavan@rimes.int", "dominic@rimes.int", "tarakesh@rimes.int", "saipraveen@rimes.int", "saurabh@rimes.int"];
  //     let emails = ["saurav97531@gmail.com"];
  //     var attachments:any[]=[];
  //     this.indexedDBService.getAllData().then(response => {
  //       response.forEach((f:any) => {
  //         let file = {
  //           filename: f.filename,
  //           path: f.base64pdf
  //         }
  //         attachments.push(file);
  //       })
  //       emails.forEach(email => {
  //         let data = {
  //           to: email,
  //           subject: `Today's Maps and Reports - ${new Date().toDateString()}`,
  //           text: "Hi This mail is being sent for testing purposes only. PFA",
  //           attachments: attachments
  //         }
  //         this.dataService.sendEmail(data).subscribe(res => {
  //           console.log("Email Sent Successfully");
  //         })
  //       })
  //     });
  //   }
  // }

  // isDataEntryAccessible(): boolean {
  //   // console.log('Checking accessibility - Selected Mode:', this.selectedMode);
  //   return this.selectedMode === 'DataEntry';
  // }

  // onLinkClick(event: MouseEvent): void {
  //   const accessible = this.isDataEntryAccessible();
  //   console.log('Link clicked - isDataEntryAccessible:', accessible);
  //   if (!accessible) {
  //     alert('Cannot access this tab when the mode is set to Unified.');
  //     console.log('Navigation prevented');
  //     event.preventDefault();
  //   }
  // }

  // onLinkClick(event: MouseEvent): void {
  //   if (this.selectedMode === 'Unified') {
  //     event.preventDefault(); // Prevent the navigation
  //     alert('Cannot access this tab when the mode is set to Unified.');
  //   }
  // }
  

  // refreshAndNavigate(): void {
  //   window.location.reload(); // Refresh the page
  //   this.router.navigate(['../all-maps']); // Navigate to the route
  // }
  
  onQpfClick(documentId: number) {
    if (documentId) {
      console.log('Fetching PDF for Document ID:', documentId);
      this.pdfService.fetchPdf(documentId); 
    } else {
      console.error('Document ID is missing');
    }
  }






  // **ADDED: Load document types from API**
  loadDocumentTypes(): void {
    console.log('hi')
    this.pdfService.getDocumentTypes().subscribe({
      next: (response: any[]) => {
        this.documentTypes = response;
        console.log('hi')

        console.log('Document types loaded:', this.documentTypes);
      },
      error: (error: any) => {
        console.error('Error loading document types:', error);
      }
    });
  }

  // **ADDED: Get documents by type**
  getDocumentsByType(documentType: string): any[] {
    const typeData = this.documentTypes.find(type => type.document_type === documentType);
    return typeData ? typeData.documents : [];
  }

  // **ADDED: Check if document type exists and has documents**
  hasDocuments(documentType: string): boolean {
    const documents = this.getDocumentsByType(documentType);
    return documents && documents.length > 0;
  }

  // **ADDED: Handle document click - use the ID from API**
  onDocumentClick(documentId: number): void {
    if (documentId) {
      console.log('Fetching PDF for Document ID:', documentId);
      this.pdfService.fetchPdf(documentId);
    } else {
      console.error('Document ID is missing');
    }
  }

  // **ADDED: Group documents by subcategory for nested structure**
  getGroupedDocuments(documentType: string): any {
    const documents = this.getDocumentsByType(documentType);
    
    if (documentType === 'DESIGN STORM ANALYSIS') {
      return this.groupDesignStormDocuments(documents);
    }
    
    return { ungrouped: documents };
  }

  // **ADDED: Group Design Storm documents into ATLASES and REPORTS**
  private groupDesignStormDocuments(documents: any[]): any {
    const atlases: any = {
      'KRISHNA BASIN PMP ATLAS': [],
      'INDUS BASIN PMP ATLAS': []
    };
    const reports: any[] = [];

    documents.forEach(doc => {
      const name = doc.document_name.toLowerCase();
      
      if (name.includes('krishna') && name.includes('basin')) {
        atlases['KRISHNA BASIN PMP ATLAS'].push(doc);
      } else if (name.includes('indus') && name.includes('basin')) {
        atlases['INDUS BASIN PMP ATLAS'].push(doc);
      } else {
        reports.push(doc);
      }
    });

    return { atlases, reports };
  }

  
 
}





