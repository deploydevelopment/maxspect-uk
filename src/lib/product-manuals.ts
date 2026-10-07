const pdf = (path: string) => `https://maxspect.com${encodeURI(path)}`;

export interface ManualFile {
  label: string;
  href: string;
}

export interface ProductManual {
  title: string;
  files: ManualFile[];
}

export interface ManualSeries {
  title: string;
  manuals: ProductManual[];
}

const download = (path: string): ManualFile => ({ label: "Download", href: pdf(path) });

export const manualSeries: ManualSeries[] = [
  {
    title: "Professional Series",
    manuals: [
      {
        title: "Commercial Gyre Pro User Manual V1.1",
        files: [download("/images/Maxspectnew/manual/Maxspect_Gyre_Pro_User_Manual_V1.1.pdf")],
      },
      {
        title: "Maxspect Commercial Floodlight Quick User Guide v1.1",
        files: [download("/images/Products/Professional/manuals/Floodlight_EN_V1.1.pdf")],
      },
    ],
  },
  {
    title: "Jump Series",
    manuals: [
      {
        title: "MJ-SK Series Gen 2 Protein Skimmer User Manual v4.0",
        files: [
          download(
            "/images/Products/Jump/manuals/MJ SK Series Gen 2 Protein Skimmer User Manual v4.0.pdf",
          ),
        ],
      },
      {
        title: "MJ-L230(R) User Manual",
        files: [download("/images/Products/Jump/manuals/MJ-L230R_User_Manual_v1.0.pdf")],
      },
      {
        title: "MJ-L260 & L290 User Manual V.1.2",
        files: [download("/images/Products/Jump/manuals/L260-L290_User_Manual_v1.2_EN.pdf")],
      },
      {
        title: "MJ-GF 308 & 316 User Manual V3.1",
        files: [download("/images/Products/Jump/manuals/GF308__3156_EN_V3.1.pdf")],
      },
      {
        title: "MJ-SK Series Protein Skimmer User Manual v3",
        files: [download("/images/Maxspectnew/manual/MJ_SK_Series_Protein_Skimmer_User_Manual_v3.pdf")],
      },
      {
        title: "MJ-L165 Series LED Lighting User Manual v4.2",
        files: [download("/images/Products/Jump/manuals/MJ-L165_User_Manual_4.2.pdf")],
      },
      {
        title: "MJ-DC Centrifugal Pump User Manual v2.0",
        files: [download("/images/firmware/Maxspect_Jump_Series_DC_Centrifugal_Pump_v20.pdf")],
      },
      {
        title: "MJ-GF Series Gyre Pump User Manual v2.0",
        files: [download("/images/Maxspectnew/manual/MJ-GF_Series_Gyre_Pump_Uaser_Manual_v20.pdf")],
      },
      {
        title: "MJ-L130 Series User Manual",
        files: [download("/images/Maxspectnew/manual/L130multilan.pdf")],
      },
      {
        title: "Diffuser Hood for MJ-L165/165 Blue User Manual V3",
        files: [download("/images/Products/Jump/manuals/Diffuser_Hood_for_MJ-L165_User_Manual_V3.pdf")],
      },
    ],
  },
  {
    title: "Innovate Series",
    manuals: [
      {
        title: "Ethereal Infinite User Manual V1.1",
        files: [download("/images/Products/Innovate/ethereal infinite/Ethereal_Infinite_EN.pdf")],
      },
      {
        title: "Maxspect Gyre 300 Cloud Edition User Manual",
        files: [
          download(
            "/images/Products/Innovate/manuals/Maxspect_Gyre_300_Series_Cloud_Edition_User_Manual_Multi-Lanuages_v1.6.pdf",
          ),
        ],
      },
      {
        title: "Maxspect Aeraqua Duo Skimmer User Manual v1.1",
        files: [download("/images/Maxspectnew/manual/AeraquaDuo_Skimmer_Manual_V1.pdf")],
      },
      {
        title: "Maxspect ICV6 Manual v3.0",
        files: [download("/images/Maxspectnew/manual/ICV6_Quick_User_Guide_30.pdf")],
      },
      {
        title: "Maxspect Turbine Duo User Manual v1.0",
        files: [download("/download/Maxspect_Turbine_Duo_User_Manual_Multiple_Languages_v1.0.pdf")],
      },
      {
        title: "Maxspect Gyre 300 User Manual V2.0",
        files: [
          download("/images/firmware/Maxspect_Gyre_300_Series_User_Manual_Multiple_Languages_V2.0.pdf"),
        ],
      },
      {
        title: "Maxspect Recurve User Manual v2.0",
        files: [download("/download/Maxspect_Recurve_User_Manual_v2.0.pdf")],
      },
      {
        title: "Maxspect RSX User Manual v2.3",
        files: [download("/images/Products/Innovate/manuals/Maxspect_RSX_User_Manual_v2.3.pdf")],
      },
      {
        title: "Maxspect Gyre 200 Series User Manual v3.1",
        files: [download("/download/Maxspect_Gyre_User_Manual_v3.1.pdf")],
      },
      {
        title: "Maxspect Ethereal User Manual v2.1",
        files: [download("/download/Maxspect_Ethereal_Quick_User_Guide_v2.3.pdf")],
      },
      {
        title: "Maxspect Glaive User Manual v1.0",
        files: [download("/download/Maxspect_Glaive_User_Manual_v1.0.pdf")],
      },
      {
        title: "Maxspect R420R User Manual v1.5",
        files: [download("/download/Maxspect_R420R_User_Manual_v1.5.pdf")],
      },
      {
        title: "Maxspect Gyre 100 Series User Manual v2.0",
        files: [download("/download/Maxspect_Gyre_100_Series_User_Manual_v2.0.pdf")],
      },
      {
        title: "Maxspect Celestial User Manual v1.0",
        files: [download("/download/Maxspect_Celestial_User_Manual_v1.0.pdf")],
      },
    ],
  },
  {
    title: "Smart Aquarium Series",
    manuals: [
      {
        title: "Lagoon Series",
        files: [
          {
            label: "LS-060",
            href: pdf("/images/Maxspectnew/manual/LS-060 Quick User Guide v1.0.pdf"),
          },
          {
            label: "LS-090",
            href: pdf("/images/Maxspectnew/manual/LS-090 Quick User Guide v1.0.pdf"),
          },
          {
            label: "LS-120",
            href: pdf("/images/Maxspectnew/manual/LS-120 Quick User Guide v1.0.pdf"),
          },
          {
            label: "LS-150",
            href: pdf("/images/Maxspectnew/manual/LS-150 Quick User Guide v1.1.pdf"),
          },
        ],
      },
      {
        title: "Dice Series Pico Cube Smart Aquarium Quick User Guide v1.1",
        files: [
          download(
            "/images/Products/SmartAquarium/manuals/Dice_Series_Pico_Cube_Smart_Aquarium_Quick_User_Guide_v1.1.pdf",
          ),
        ],
      },
      {
        title: "Dice 12G AIO",
        files: [
          {
            label: "User manual",
            href: pdf("/images/Products/Innovate/manuals/Dice_Series_Nano_Cube_User_Manual_v1.0.pdf"),
          },
          {
            label: "Stand assembly guide",
            href: pdf("/images/Products/Innovate/manuals/Stand_Assembly_Guide_for_DICE_12G_AIO_v1.0.pdf"),
          },
        ],
      },
    ],
  },
  {
    title: "Nano-Tech Bio-Media",
    manuals: [
      {
        title: "Nano-Tech Phosphree User Manual 2.0",
        files: [download("/images/Products/Nano-tech/manuals/Nano-Tech_Phosphree_User_Manual_v2.0.pdf")],
      },
    ],
  },
  {
    title: "Coral Tools",
    manuals: [
      {
        title: "Coral Putty User Manual V1.1",
        files: [download("/images/Maxspectnew/manual/Coral_Putty_User_Manual_v11.pdf")],
      },
      {
        title: "Aiptasia Control User Manual v1.0",
        files: [
          download("/images/Products/Coral/manuals/Aiptasia_Control_User_Manual_Multi_Languages_v1.0.pdf"),
        ],
      },
    ],
  },
];
