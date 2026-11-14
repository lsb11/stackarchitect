import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts')))

from generate_apps import generate_savings

class TestGenerateSavings(unittest.TestCase):
    def test_happy_paths(self):
        self.assertEqual(generate_savings("$59+"), "$708/yr")
        self.assertEqual(generate_savings("$1,000+"), "$12,000/yr")
        self.assertEqual(generate_savings("$20"), "$240/yr")

    def test_error_conditions(self):
        self.assertEqual(generate_savings("$invalid"), "100% of subscription cost")
        self.assertEqual(generate_savings("$100.50"), "100% of subscription cost")

    def test_non_dollar_strings(self):
        self.assertEqual(generate_savings("Free"), "100% of subscription cost")
        self.assertEqual(generate_savings("Custom"), "100% of subscription cost")

if __name__ == '__main__':
    unittest.main()
