import xlsx from 'xlsx'
import * as fs from 'fs'

export const createDocument = () => {
  xlsx.set_fs(fs)
}