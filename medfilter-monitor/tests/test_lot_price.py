from medfilter_monitor.lot_analysis import extract_price_from_html, format_lot_price, parse_money
from medfilter_monitor.providers.rostender import parse_rostender_html


def test_parse_money_formats():
    assert parse_money("119 906 ₽") == 119906.0
    assert parse_money("НМЦК 1 312 983,28 руб.") == 1312983.28
    assert parse_money("цена лота: 450000 ₽") == 450000.0


def test_extract_price_nachalnaya():
    html = """
    <html><body>
    Начальная цена
    119 906 ₽
    Место поставки
    г. Саров
    </body></html>
    """
    price, meta = extract_price_from_html(html)
    assert price == 119906.0
    assert meta.get("price_source")


def test_rostender_price_and_format():
    html = """
    <html><head><title>Фильтры бактериальные | РосТендер</title></head>
    <body>
    Закупка: 0332100025126000267
    Начальная цена
    119 906 ₽
    Заказчик
    Наименование
    ГБУЗ Тест
    ИНН
    5254002113
    44-ФЗ
    </body></html>
    """
    item = parse_rostender_html(html, url="https://rostender.info/x/1-tender-y", query="фильтр")
    assert item is not None
    assert item.price == 119906.0
    assert "119 906" in format_lot_price(item.price)
