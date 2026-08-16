import * as XLSX from 'xlsx'
import type { Invoice } from '../types'
import { calcInvoice, laborAmount, partAmount, vatLabel } from './calc'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportInvoiceToExcel(invoice: Invoice) {
  const totals = calcInvoice(invoice)
  const book = XLSX.utils.book_new()

  const headerRows = [
    ['СчётМастер — выгрузка счёта'],
    [],
    ['Номер счёта', invoice.number],
    ['Дата', invoice.date],
    ['Номер авто', invoice.vehicleNumber || '—'],
    ['НДС', vatLabel(invoice)],
    [],
    ['Поставщик', invoice.seller.name],
    ['ИНН поставщика', invoice.seller.inn],
    ['Телефон поставщика', invoice.seller.phone],
    ['Адрес поставщика', invoice.seller.address],
    [],
    ['Покупатель', invoice.buyer.name],
    ['ИНН покупателя', invoice.buyer.inn],
    ['Телефон покупателя', invoice.buyer.phone],
    ['Адрес покупателя', invoice.buyer.address],
    [],
    ['Примечание', invoice.notes || ''],
  ]
  const headerSheet = XLSX.utils.aoa_to_sheet(headerRows)
  headerSheet['!cols'] = [{ wch: 24 }, { wch: 48 }]
  XLSX.utils.book_append_sheet(book, headerSheet, 'Реквизиты')

  const laborRows = [
    ['№', 'Наименование работ', 'Нормочасы', 'Ставка, руб', 'Сумма, руб'],
    ...invoice.labor.map((line, index) => [
      index + 1,
      line.name,
      line.hours,
      line.rate,
      laborAmount(line),
    ]),
  ]
  const laborSheet = XLSX.utils.aoa_to_sheet(laborRows)
  laborSheet['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(book, laborSheet, 'Работы')

  const partRows = [
    ['№', 'Наименование', 'Артикул', 'Кол-во', 'Цена, руб', 'Сумма, руб'],
    ...invoice.parts.map((line, index) => [
      index + 1,
      line.name,
      line.sku,
      line.quantity,
      line.unitPrice,
      partAmount(line),
    ]),
  ]
  const partSheet = XLSX.utils.aoa_to_sheet(partRows)
  partSheet['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(book, partSheet, 'Запчасти')

  const totalRows = [
    ['Показатель', 'Сумма, руб'],
    ['Работы', totals.laborNet],
    ['Запчасти', totals.partsNet],
    [totals.vatEnabled ? 'Сумма без НДС' : 'Сумма', totals.net],
    [
      totals.vatEnabled ? `НДС ${totals.vatPercent}%` : 'НДС',
      totals.vatEnabled ? totals.vat : 'Без НДС',
    ],
    ['К оплате', totals.gross],
  ]
  const totalSheet = XLSX.utils.aoa_to_sheet(totalRows)
  totalSheet['!cols'] = [{ wch: 22 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(book, totalSheet, 'Итоги')

  const safeName = (invoice.number || 'schet').replace(/[\\/:*?"<>|]+/g, '_')
  const filename = `${safeName}${invoice.vehicleNumber ? `_${invoice.vehicleNumber}` : ''}.xlsx`
  const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    filename,
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
}
