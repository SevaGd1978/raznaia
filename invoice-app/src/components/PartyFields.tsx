import type { PartyInfo } from '../types'

interface PartyFieldsProps {
  title: string
  value: PartyInfo
  onChange: (next: PartyInfo) => void
}

export function PartyFields({ title, value, onChange }: PartyFieldsProps) {
  function set<K extends keyof PartyInfo>(key: K, next: PartyInfo[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <fieldset className="party-fields">
      <legend>{title}</legend>
      <label>
        <span>Наименование</span>
        <input
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="ООО «Клиент» / ФИО"
        />
      </label>
      <div className="party-grid">
        <label>
          <span>ИНН</span>
          <input
            value={value.inn}
            onChange={(e) => set('inn', e.target.value)}
            placeholder="0000000000"
          />
        </label>
        <label>
          <span>Телефон</span>
          <input
            value={value.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+7 …"
          />
        </label>
      </div>
      <label>
        <span>Адрес</span>
        <input
          value={value.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Город, улица, дом"
        />
      </label>
    </fieldset>
  )
}
