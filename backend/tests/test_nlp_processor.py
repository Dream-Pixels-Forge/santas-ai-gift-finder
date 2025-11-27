"""
Unit tests for NLP processor functionality
"""

import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from nlp_processor import process_query, KNOWLEDGE_BASE


class TestNLPProcessor(unittest.TestCase):
    """Test cases for NLP processing functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_queries = [
            "birthday gift for 10 year old boy",
            "christmas present for my wife",
            "anniversary gift for husband",
            "baby shower gift",
            "graduation gift for niece",
            "cooking gift for mom",
            "gaming gift for teenager",
            ""
        ]

    def test_process_query_basic(self):
        """Test basic query processing"""
        result = process_query("birthday gift for 10 year old boy")

        self.assertIsInstance(result, dict)
        self.assertIn('age', result)
        self.assertIn('relationship', result)
        self.assertIn('interests', result)
        self.assertIn('sentiment', result)
        self.assertIn('entities', result)

    def test_process_query_age_extraction(self):
        """Test age extraction from queries"""
        test_cases = [
            ("gift for 5 year old", 5),
            ("present for 12-year-old boy", 12),
            ("toy for 8 yo child", 8),
            ("gift for adult", None),
            ("birthday present", None)
        ]

        for query, expected_age in test_cases:
            with self.subTest(query=query):
                result = process_query(query)
                self.assertEqual(result['age'], expected_age)

    def test_process_query_relationship_extraction(self):
        """Test relationship extraction"""
        test_cases = [
            ("gift for my wife", "wife"),
            ("present for husband", "husband"),
            ("toy for niece", "niece"),
            ("gift for son", "son"),
            ("birthday for friend", "friend"),
            ("present for colleague", None)
        ]

        for query, expected_rel in test_cases:
            with self.subTest(query=query):
                result = process_query(query)
                self.assertEqual(result['relationship'], expected_rel)

    def test_process_query_empty_input(self):
        """Test processing of empty queries"""
        result = process_query("")

        self.assertIsInstance(result, dict)
        self.assertIsNone(result['age'])
        self.assertIsNone(result['relationship'])
        self.assertEqual(result['interests'], [])
        self.assertEqual(result['entities'], [])

    def test_process_query_sentiment_analysis(self):
        """Test sentiment analysis"""
        positive_query = "amazing birthday gift for wonderful child"
        negative_query = "terrible gift for annoying kid"

        pos_result = process_query(positive_query)
        neg_result = process_query(negative_query)

        # Positive sentiment should have higher compound score
        self.assertGreater(pos_result['sentiment']['compound'], 0)
        self.assertLess(neg_result['sentiment']['compound'], 0)

    def test_process_query_interests_extraction(self):
        """Test interests extraction from queries"""
        test_cases = [
            ("gaming gift for teenager", ["gaming", "gift"]),
            ("cooking present for mom", ["cooking", "present"]),
            ("art supplies for child", ["art", "supplies"]),
            ("science kit for student", ["science", "kit", "student"])
        ]

        for query, expected_interests in test_cases:
            with self.subTest(query=query):
                result = process_query(query)
                interests = result['interests']
                # Check that expected interests are present
                for interest in expected_interests:
                    if interest in ['gift', 'present', 'supplies', 'kit']:  # Common words
                        continue
                    self.assertIn(interest, interests)

    def test_knowledge_base_structure(self):
        """Test knowledge base has expected structure"""
        self.assertIsInstance(KNOWLEDGE_BASE, dict)
        self.assertGreater(len(KNOWLEDGE_BASE), 0)

        # Check that each interest has gifts
        for interest, gifts in KNOWLEDGE_BASE.items():
            self.assertIsInstance(gifts, list)
            self.assertGreater(len(gifts), 0)

            # Check gift structure
            for gift in gifts:
                self.assertIsInstance(gift, dict)
                self.assertIn('name', gift)
                self.assertIn('category', gift)

    @patch('nlp_processor.nlp')
    def test_process_query_spacy_fallback(self, mock_nlp):
        """Test fallback when spaCy is not available"""
        mock_nlp.return_value = None

        result = process_query("birthday gift for child")

        # Should still return valid result using fallback processing
        self.assertIsInstance(result, dict)
        self.assertIn('interests', result)

    def test_process_query_entities_extraction(self):
        """Test named entity extraction"""
        query_with_entities = "birthday gift for John from Amazon"
        result = process_query(query_with_entities)

        # Should extract entities if spaCy is available
        self.assertIsInstance(result['entities'], list)

    def test_process_query_recommendations(self):
        """Test that recommendations are generated"""
        result = process_query("gaming gift for teenager")

        self.assertIn('recommendations', result)
        self.assertIsInstance(result['recommendations'], list)

    def test_process_query_matched_interests(self):
        """Test that interests are matched against knowledge base"""
        result = process_query("gaming gift")

        self.assertIn('matched_interests', result)
        self.assertIsInstance(result['matched_interests'], list)


if __name__ == '__main__':
    unittest.main()