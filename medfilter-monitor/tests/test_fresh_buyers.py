from medfilter_monitor.buyers import classify_customer, is_private_customer
from medfilter_monitor.freshness import freshness_label, is_fresh, parse_date
from medfilter_monitor.providers.rostender import parse_rostender_html


def test_classify_private_and_state():
    assert classify_customer('ООО "НЕФРОЛАЙН"') == "private"
    assert classify_customer("ГБУЗ Городская больница") == "state"
    assert is_private_customer("АО Группа компаний Медси")


def test_freshness_historical():
    assert freshness_label("2020-01-01") == "historical"
    assert is_fresh("2020-01-01", max_age_days=100) is False
    assert parse_date("09.04.2026") is not None


def test_parse_rostender_html_smoke():
    html = """
    <html><head><title>Приобретение фильтров бактериальных для аппаратов ИВЛ | РосТендер</title></head>
    <body>
    Закупка: 0332100025126000267
    Окончание (МСК)
    09.04.2026
    Заказчик
    Наименование
    ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ "КЛИНИЧЕСКАЯ БОЛЬНИЦА № 50"
    ИНН
    5254002113
    44-ФЗ
    </body></html>
    """
    item = parse_rostender_html(
        html,
        url="https://rostender.info/region/x/91196984-tender-priobretenie-filtrov",
        query="фильтр",
    )
    assert item is not None
    assert "0332100025126000267" in item.id or item.raw.get("reg") == "0332100025126000267"
    assert "БОЛЬНИЦА" in item.customer
    assert item.law == "44"
