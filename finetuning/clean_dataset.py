#!/usr/bin/env python3
"""
Script to clean the fine-tuning dataset by replacing potentially problematic terms
that might trigger OpenAI's sexual content moderation.
"""

import json
import re

def clean_text(text):
    """
    Replace potentially problematic terms with safer alternatives.
    """
    replacements = {
        # Replace "luxo" (luxury) with safer alternatives
        r'\bluxo\b': 'exclusivo',
        r'\bLuxo\b': 'Exclusivo',
        r'\bLUXO\b': 'EXCLUSIVO',
        
        # Replace "premium" with alternatives
        r'\bpremium\b': 'superior',
        r'\bPremium\b': 'Superior',
        r'\bPREMIUM\b': 'SUPERIOR',
        
        # Replace "acabamentos de luxo" (luxury finishes)
        r'acabamentos de luxo': 'acabamentos exclusivos',
        r'Acabamentos de luxo': 'Acabamentos exclusivos',
        
        # Replace "luxury" in English if present
        r'\bluxury\b': 'exclusive',
        r'\bLuxury\b': 'Exclusive',
        r'\bLUXURY\b': 'EXCLUSIVE',
    }
    
    cleaned_text = text
    for pattern, replacement in replacements.items():
        cleaned_text = re.sub(pattern, replacement, cleaned_text)
    
    return cleaned_text

def clean_dataset(input_file, output_file):
    """
    Clean the entire dataset by processing each JSON line.
    """
    cleaned_lines = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                # Parse the JSON line
                data = json.loads(line.strip())
                
                # Clean the messages
                if 'messages' in data:
                    for message in data['messages']:
                        if 'content' in message:
                            message['content'] = clean_text(message['content'])
                
                # Write the cleaned data
                cleaned_lines.append(json.dumps(data, ensure_ascii=False))
                
            except json.JSONDecodeError as e:
                print(f"Warning: Invalid JSON on line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}")
                continue
    
    # Write the cleaned dataset
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in cleaned_lines:
            f.write(line + '\n')
    
    print(f"Cleaned dataset saved to: {output_file}")
    print(f"Processed {len(cleaned_lines)} lines")

def main():
    input_file = "realestate_pairs_corrected.jsonl"
    output_file = "realestate_pairs_cleaned.jsonl"
    
    print("Cleaning fine-tuning dataset...")
    print("Replacing potentially problematic terms:")
    print("- 'luxo' → 'exclusivo'")
    print("- 'premium' → 'superior'")
    print("- 'acabamentos de luxo' → 'acabamentos exclusivos'")
    print()
    
    clean_dataset(input_file, output_file)
    
    print("\nCleaning complete!")
    print("Please review the cleaned dataset before using it for fine-tuning.")

if __name__ == "__main__":
    main() 