from decimal import Decimal

from app.services.challan_parser import _parse_153_challan


def test_parse_153_challan_extracts_section_details():
    text = """
    CNIC of Depositor: 1310112184639
    Name of Depositor: KHAWAR KHAN
    Payment Section: 153(1)(a)
    Description: Payment for Goods u/s 153(1)(a) (ATL @ 5% / Non-ATL @ 10%) for companies
    Payment Section Code: 64060010
    Total Tax Deducted: 663,370
    """

    result = _parse_153_challan(text)

    assert result.client_name == "KHAWAR KHAN"
    assert result.cnic == "1310112184639"
    assert result.payment_section_code == "64060010"
    assert result.amount == Decimal("663370")
