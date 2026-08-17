import type { Counterparty, DocumentItem, Order, Vehicle } from '../types'
import { docKindLabels, formatDate, formatMoney, statusLabels } from '../data/seed'

export type DocumentContext = {
  doc: DocumentItem
  order: Order
  client?: Counterparty
  carrier?: Counterparty
  vehicle?: Vehicle
}

export function buildDocumentLines(ctx: DocumentContext): string[] {
  const { doc, order, client, carrier, vehicle } = ctx
  const route = `${order.fromCity} — ${order.toCity}`
  const common = [
    `Заказ: ${order.number}`,
    `Маршрут: ${route}`,
    `Груз: ${order.cargo}, ${order.weightTons} т`,
    `Погрузка: ${formatDate(order.loadingDate)}`,
    `Доставка: ${formatDate(order.deliveryDate)}`,
    `Статус заказа: ${statusLabels[order.status]}`,
  ]

  switch (doc.kind) {
    case 'request':
      return [
        'Заявка на перевозку груза',
        ...common,
        `Заказчик: ${client?.name ?? '—'}`,
        `ИНН: ${client?.inn ?? '—'}`,
        `Контакт: ${client?.contactPerson ?? '—'}, ${client?.phone ?? ''}`,
        `Исполнитель: ${carrier?.name ?? 'Не назначен'}`,
        `Транспорт: ${vehicle ? `${vehicle.plate}, ${vehicle.brand}, ${vehicle.type}` : 'Не назначен'}`,
        `Ставка заказчику: ${formatMoney(order.clientRate)}`,
        order.notes ? `Примечание: ${order.notes}` : '',
      ].filter(Boolean)
    case 'invoice':
      return [
        `Счёт на оплату по заказу ${order.number}`,
        `Плательщик: ${client?.name ?? '—'}`,
        `ИНН плательщика: ${client?.inn ?? '—'}`,
        `Услуга: перевозка груза по маршруту ${route}`,
        `Груз: ${order.cargo}`,
        `Сумма к оплате: ${formatMoney(order.clientRate)}`,
        'НДС: без НДС / по условиям договора',
        `Основание: заявка ${order.number} от ${formatDate(order.createdAt)}`,
      ]
    case 'act':
      return [
        'Акт выполненных работ (услуг)',
        `Исполнитель услуг: ООО «ТрансЛогистика»`,
        `Заказчик: ${client?.name ?? '—'}`,
        `Заказ: ${order.number}`,
        `Оказанная услуга: организация перевозки ${route}`,
        `Период оказания: ${formatDate(order.loadingDate)} — ${formatDate(order.deliveryDate)}`,
        `Стоимость услуг: ${formatMoney(order.clientRate)}`,
        'Работы выполнены в полном объёме, стороны претензий не имеют.',
      ]
    case 'contract':
      return [
        'Договор-заявка на транспортно-экспедиционные услуги',
        `Заказчик: ${client?.name ?? '—'}, ИНН ${client?.inn ?? '—'}`,
        `Исполнитель: ООО «ТрансЛогистика»`,
        ...common,
        `Вознаграждение исполнителя: ${formatMoney(order.clientRate)}`,
        `Ставка привлечённому перевозчику: ${formatMoney(order.carrierRate)}`,
        'Документ сформирован в демо-режиме CargoDesk.',
      ]
    case 'waybill':
      return [
        'Транспортная накладная (сопроводительный документ)',
        ...common,
        `Грузоотправитель / заказчик: ${client?.name ?? '—'}`,
        `Перевозчик: ${carrier?.name ?? '—'}`,
        `ТС: ${vehicle ? `${vehicle.brand} ${vehicle.plate}` : '—'}`,
        `Тип кузова: ${vehicle?.type ?? '—'}`,
        `Грузоподъёмность: ${vehicle ? `${vehicle.capacityTons} т` : '—'}`,
      ]
    default:
      return [`Документ: ${docKindLabels[doc.kind]}`, ...common]
  }
}

export function documentSubtitle(kind: DocumentItem['kind']) {
  return docKindLabels[kind]
}
