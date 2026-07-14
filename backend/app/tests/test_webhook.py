import unittest
from unittest.mock import MagicMock, patch
import json
import hmac
import hashlib
from datetime import datetime

# Import target functions
from app.services.whatsapp import verify_signature, parse_webhook, save_incoming_message
from app.models.whatsapp import MessageDirection

class TestWhatsAppWebhook(unittest.TestCase):
    
    def setUp(self):
        self.app_secret = "acme_app_secret_abc123"
        self.verify_token = "acme_production_secure_handshake_token"

    def test_signature_verification_success(self):
        """
        Verify that a valid X-Hub-Signature-256 is successfully verified.
        """
        payload = b'{"object":"whatsapp_business_account"}'
        computed_sig = hmac.new(
            self.app_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()
        signature_header = f"sha256={computed_sig}"
        
        is_valid = verify_signature(payload, signature_header, self.app_secret)
        self.assertTrue(is_valid)

    def test_signature_verification_failure(self):
        """
        Verify that invalid signatures are rejected.
        """
        payload = b'{"object":"whatsapp_business_account"}'
        signature_header = "sha256=invalid_signature_checksum"
        
        is_valid = verify_signature(payload, signature_header, self.app_secret)
        self.assertFalse(is_valid)

    def test_parse_text_payload(self):
        """
        Test parsing of incoming WhatsApp text messages.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "15550199999",
                            "phone_number_id": "10998577234859"
                        },
                        "contacts": [{"profile": {"name": "Alex Johnson"}, "wa_id": "15550188888"}],
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.text123",
                            "timestamp": "1710955200",
                            "type": "text",
                            "text": {"body": "Hello support"}
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["phone_number_id"], "10998577234859")
        self.assertEqual(parsed["customer_phone"], "15550188888")
        self.assertEqual(parsed["customer_name"], "Alex Johnson")
        self.assertEqual(parsed["message_text"], "Hello support")
        self.assertEqual(parsed["message_type"], "text")
        self.assertEqual(parsed["whatsapp_message_id"], "wamid.text123")

    def test_parse_image_payload(self):
        """
        Test parsing of incoming image messages.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"phone_number_id": "10998577234859"},
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.image123",
                            "type": "image",
                            "image": {
                                "id": "media_id_5544",
                                "caption": "Company logo screenshot"
                            }
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["message_type"], "image")
        self.assertEqual(parsed["message_text"], "[Image] ID: media_id_5544 - Company logo screenshot")

    def test_parse_document_payload(self):
        """
        Test parsing of incoming document attachments.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"phone_number_id": "10998577234859"},
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.doc123",
                            "type": "document",
                            "document": {
                                "id": "media_id_doc9988",
                                "filename": "invoice_7755.pdf",
                                "caption": "Monthly bill"
                            }
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["message_type"], "document")
        self.assertEqual(parsed["message_text"], "[Document] ID: media_id_doc9988 (invoice_7755.pdf) - Monthly bill")

    def test_parse_location_payload(self):
        """
        Test parsing of incoming geo-location pins.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"phone_number_id": "10998577234859"},
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.loc123",
                            "type": "location",
                            "location": {
                                "latitude": 37.7749,
                                "longitude": -122.4194,
                                "name": "San Francisco Head Office",
                                "address": "Market Street, SF, CA"
                            }
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["message_type"], "location")
        self.assertEqual(parsed["message_text"], "[Location] Lat: 37.7749, Lng: -122.4194 (San Francisco Head Office) - Market Street, SF, CA")

    def test_parse_reaction_payload(self):
        """
        Test parsing of incoming emoji reactions on existing messages.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"phone_number_id": "10998577234859"},
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.react123",
                            "type": "reaction",
                            "reaction": {
                                "emoji": "👍",
                                "message_id": "wamid.target_msg_id_456"
                            }
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["message_type"], "reaction")
        self.assertEqual(parsed["message_text"], "[Reaction] 👍 on message wamid.target_msg_id_456")

    def test_parse_unsupported_payload_safely(self):
        """
        Test that unsupported payload types (e.g. contacts attachment) are handled safely without crashing.
        """
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"phone_number_id": "10998577234859"},
                        "messages": [{
                            "from": "15550188888",
                            "id": "wamid.contacts123",
                            "type": "contacts",
                            "contacts": []
                        }]
                    }
                }]
            }]
        }
        parsed = parse_webhook(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["message_type"], "contacts")
        self.assertEqual(parsed["message_text"], "[Unsupported Message Type: contacts]")

if __name__ == "__main__":
    unittest.main()
