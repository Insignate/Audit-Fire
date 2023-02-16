//import xlsx from 'xlsx'
import { saveAs } from "file-saver";
import { ISvrSingleJobDriveReport, ISvrSingleJobNotWorkingDriveReport } from '../../tsTypes/psqlResponses';
import {
  AlignmentType,
  Document, 
  HeadingLevel, 
  ImageRun, 
  Packer, 
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx'
import { picFetch } from "../fetchs";


export class DocumentReport{
  
  public fileName : string = "Certificate of Sanitization" 

  private headerText = "Certificate of Sanitization of Drives"
  private digitalSanitize = "Digitally Sanitized Drives"
  private physicalDestroy = "Physically Destroyed"
  private notWorkingDestroyed = "Not Working and Physically Destroyed"
  private topMessage = "Coretek Enterprises, LLC certifies that all materials were destroyed by an industrial shredding process"

  public drives = async (
    wipedDrives: Array<ISvrSingleJobDriveReport>, 
    destroyedDrives: Array<ISvrSingleJobDriveReport>,
    notWorkingDrives: Array<ISvrSingleJobNotWorkingDriveReport>
  ) => {
    const doc = new Document({
      sections: [
        {
          children: [
            await this.createLogo(),
            new Paragraph({}),
            this.createHeader(),
            new Paragraph({}),
            this.createInfoMessage(),
            new Paragraph({}),
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.digitalSanitize,
                  bold: true
                })
              ]
            }),
            new Paragraph({}),
            new Table({
              rows: 
                this.createWipedRows(wipedDrives)
            }),
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.physicalDestroy,
                  bold: true
                })
              ]
            }),
            new Paragraph({}),
            new Table({
              rows:
                this.createDestroyedRows(destroyedDrives)
            }),
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.notWorkingDestroyed,
                  bold: true
                })
              ]
            }),
            new Paragraph({}),
            new Table({
              rows:
                this.createNonWorkingDestroyedRows(notWorkingDrives)
            })
          ]
        }
      ]
    })
    this.saveFile(doc)
  }
  public destroyDrives = async (
    destroyedDrives: Array<ISvrSingleJobDriveReport>,
    notWorkingDrives: Array<ISvrSingleJobNotWorkingDriveReport>,
  ) => {
    const doc = new Document({
      sections: [
        {
          children: [
            await this.createLogo(),
            new Paragraph({}),
            this.createHeader(),
            new Paragraph({}),
            this.createInfoMessage(),
            new Paragraph({}),
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.physicalDestroy,
                  bold: true
                })
              ]
            }),
            new Paragraph({}),
            new Table({
              rows:
                this.createDestroyedRows(destroyedDrives)
            }),
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.notWorkingDestroyed,
                  bold: true
                })
              ]
            }),
            new Paragraph({}),
            new Table({
              rows:
                this.createNonWorkingDestroyedRows(notWorkingDrives)
            })
          ]
        }
      ]
    })
    this.saveFile(doc)
  }

  private saveFile = (doc: Document) => {
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, this.fileName + ".docx");
    })
  }
  private createLogo = async () => {
    const svrResp: ArrayBuffer | {error: string} = await picFetch("logo.png")
    console.log(svrResp instanceof ArrayBuffer)
    if (svrResp instanceof ArrayBuffer){
      return new Paragraph({
        children: [
          new ImageRun({
            data: svrResp,
            transformation: {
              width: 300,
              height: 98
            }
          })
        ],
        alignment: AlignmentType.CENTER
      })
    }
    else return new Paragraph({})
    
  }
  private createHeader = () => {
    return new Paragraph({
      text: this.headerText,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    })
  }
  private createInfoMessage = () => {
    return new Paragraph({
      text: this.topMessage,
      alignment: AlignmentType.CENTER
    })
  }
  private createNonWorkingDestroyedRows = (drives: Array<ISvrSingleJobNotWorkingDriveReport>) => {
    const newRows = []
    newRows.push(
      new TableRow({
        children: [
          this.createTableHeader("Serial Number"),
          this.createTableHeader("Size")
          
        ]
      }),
    )
    drives.forEach(({serial_number, size}) => {
      return newRows.push(
        new TableRow({
          children: [
            this.createTableCell(serial_number, 40),
            this.createTableCell(size > 999 ? (size/1000).toString() + " tb" : size.toString() + " gb",10)
          ]
        })
      )
    })
    return newRows
  }
  private createDestroyedRows = (destroyedDrives: Array<ISvrSingleJobDriveReport>) => {
    const newRows = []
    newRows.push(
      new TableRow({
        children: [
          this.createTableHeader("Model"),
          this.createTableHeader("Serial Number"),
          this.createTableHeader("Size"),
        ]
      }),
    )
    destroyedDrives.forEach(({name, serial_number, size}) => {
      return newRows.push(
        new TableRow({
          children: [
            this.createTableCell(name, 45),
            this.createTableCell(serial_number, 45),
            this.createTableCell(size > 999 ? (size/1000).toString() + " tb" : size.toString() + " gb",10 )
          ]
        })
      )
    })
    return newRows
  }
  
  private createWipedRows = (wipedDrives: Array<ISvrSingleJobDriveReport>) => {
    const newRows = []
    newRows.push(
      new TableRow({
        children: [
          this.createTableHeader("Model"),
          this.createTableHeader("Serial Number"),
          this.createTableHeader("Size"),
          this.createTableHeader("Start Wipe"),
          this.createTableHeader("End Wipe"),
        ]
      })
    )
    wipedDrives.forEach(({name, serial_number, size, wipe_start, wipe_end}) => {
      return newRows.push(
        new TableRow({
          children: [
            this.createTableCell(name, 20),
            this.createTableCell(serial_number, 21),
            this.createTableCell(size > 999 ? (size/1000).toString() + " tb" : size.toString() + " gb" , 13),
            this.createTableCell(wipe_start, 23),
            this.createTableCell(wipe_end, 23)
          ]
        })
      )
    })
    return newRows
  }

  private createTableHeader = (text: string) => {
    return new TableCell({
      children:[
        this.createBoldParagraph(text)
      ]
    })
  }
  private createTableCell = (text: string, widthPercent: number) => {
    return new TableCell({
      children:[
        this.createParagraph(text),
      ],
      width: {size: widthPercent, type: WidthType.PERCENTAGE}
    })
  }
  private createBoldParagraph = (text: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true
        })
      ]
    })
  }
  private createParagraph = (text: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
        })
      ]
    })
  }
}
