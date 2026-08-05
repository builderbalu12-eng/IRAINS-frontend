/**
 * The 30 MC / RMC district sets.
 *
 * Names and ids are not invented here — each entry was read out of its own
 * geojson (`RMC_MC` / `RMC_MC_ID` on the first feature). The list is static
 * because the geojson files are static assets; if a centre is added, drop its
 * file into assets/geojson/MCRMCs and add the row.
 *
 * INDIA_DISTRICT.json only carries 22 distinct RMC_MC values, so it cannot be
 * used to derive this list.
 */
export interface RmuMcEntry {
  /** as printed on the sheet, e.g. "MC BHUBANESWAR" / "RMC CHENNAI" */
  name: string;
  /** RMC_MC_ID from the geojson */
  id: number;
  geojson: string;
}

export const RMU_MC_LIST: RmuMcEntry[] = [
  { name: "MC AGARTALA", id: 23, geojson: "assets/geojson/MCRMCs/MC_AGARTALA.json" },
  { name: "MC AHMEDABAD", id: 1, geojson: "assets/geojson/MCRMCs/AHM.json" },
  { name: "MC AIZAWL", id: 24, geojson: "assets/geojson/MCRMCs/MC_AIZAWL.json" },
  { name: "MC AMARAVATI", id: 2, geojson: "assets/geojson/MCRMCs/amv.json" },
  { name: "MC BENGALURU", id: 3, geojson: "assets/geojson/MCRMCs/MC_BNG.json" },
  { name: "MC BHOPAL", id: 4, geojson: "assets/geojson/MCRMCs/MC_BHP.json" },
  { name: "MC BHUBANESWAR", id: 5, geojson: "assets/geojson/MCRMCs/MC_BBN.json" },
  { name: "MC CHANDIGARH", id: 6, geojson: "assets/geojson/MCRMCs/MC_CHD.json" },
  { name: "MC DEHRADUN", id: 7, geojson: "assets/geojson/MCRMCs/MC_DDN.json" },
  { name: "MC GANGTOK", id: 25, geojson: "assets/geojson/MCRMCs/MC_GANGTOK.json" },
  { name: "MC HYDERABAD", id: 8, geojson: "assets/geojson/MCRMCs/MC_HYD.json" },
  { name: "MC IMPHAL", id: 26, geojson: "assets/geojson/MCRMCs/MC_IMPHAL.json" },
  { name: "MC ITANAGAR", id: 28, geojson: "assets/geojson/MCRMCs/MC_ITANAGAR.json" },
  { name: "MC JAIPUR", id: 9, geojson: "assets/geojson/MCRMCs/MC_JPR.json" },
  { name: "MC KOHIMA", id: 27, geojson: "assets/geojson/MCRMCs/MC_KOHIMA.json" },
  { name: "MC LUCKNOW", id: 10, geojson: "assets/geojson/MCRMCs/MC_LKN.json" },
  { name: "MC PATNA", id: 11, geojson: "assets/geojson/MCRMCs/MC_PTN.json" },
  { name: "MC RAIPUR", id: 12, geojson: "assets/geojson/MCRMCs/MC_RPR.json" },
  { name: "MC RANCHI", id: 13, geojson: "assets/geojson/MCRMCs/MC_RNC.json" },
  { name: "MC SHILLONG", id: 30, geojson: "assets/geojson/MCRMCs/MC_SHILLONG.json" },
  { name: "MC SHIMLA", id: 14, geojson: "assets/geojson/MCRMCs/MC_SML.json" },
  { name: "MC SRINAGAR", id: 15, geojson: "assets/geojson/MCRMCs/MC_SRN.json" },
  { name: "MC THIRVANTHAPURAM", id: 16, geojson: "assets/geojson/MCRMCs/MC_TRV.json" },
  { name: "MC VIJAYA PURAM", id: 29, geojson: "assets/geojson/MCRMCs/MC_VIJAYA_PURAM.json" },
  { name: "RMC CHENNAI", id: 17, geojson: "assets/geojson/MCRMCs/MC_CNI.json" },
  { name: "RMC GUWAHATI", id: 18, geojson: "assets/geojson/MCRMCs/MC_GHT.json" },
  { name: "RMC KOLKATA", id: 19, geojson: "assets/geojson/MCRMCs/MC_KOL.json" },
  { name: "RMC MUMBAI", id: 20, geojson: "assets/geojson/MCRMCs/MC_MUM.json" },
  { name: "RMC NAGPUR", id: 21, geojson: "assets/geojson/MCRMCs/MC_NAG.json" },
  { name: "RMC NEW DELHI", id: 22, geojson: "assets/geojson/MCRMCs/RMC_DLH.json" },
];
