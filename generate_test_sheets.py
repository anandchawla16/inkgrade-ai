import os
from PIL import Image, ImageDraw, ImageFont

def create_lined_paper(width=1000, height=1400):
    # Warm off-white lined paper
    img = Image.new("RGB", (width, height), color=(252, 251, 247))
    draw = ImageDraw.Draw(img)
    
    # Draw horizontal blue lines every 36px starting at y=160
    line_spacing = 38
    for y in range(160, height - 60, line_spacing):
        draw.line([(0, y), (width, y)], fill=(215, 227, 245), width=1)
        
    # Draw red vertical margin line at x=140
    draw.line([(140, 0), (140, height)], fill=(245, 180, 180), width=2)
    return img

def generate_math_sheet(output_path):
    img = create_lined_paper()
    draw = ImageDraw.Draw(img)
    
    # Fonts
    try:
        header_font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 20)
        title_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
        question_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 22)
        handwriting = ImageFont.truetype(r"C:\Windows\Fonts\Inkfree.ttf", 26)
        handwriting_bold = ImageFont.truetype(r"C:\Windows\Fonts\Inkfree.ttf", 28)
    except:
        header_font = title_font = question_font = handwriting = handwriting_bold = ImageFont.load_default()

    # Header
    draw.text((160, 45), "Name: Alex Miller          Date: Nov 12          Grade: 7-B", fill=(50, 50, 50), font=header_font)
    draw.text((160, 95), "Algebra & Arithmetic Quiz #3", fill=(20, 20, 20), font=title_font)
    draw.line([(160, 130), (840, 130)], fill=(70, 70, 70), width=2)
    
    ink_color = (25, 45, 130) # Classic blue ballpoint ink
    
    # Question 1 (CORRECT)
    draw.text((160, 175), "1) Solve for x:   2x + 7 = 19", fill=(30, 30, 30), font=question_font)
    draw.text((180, 215), "2x = 19 - 7", fill=ink_color, font=handwriting)
    draw.text((180, 253), "2x = 12", fill=ink_color, font=handwriting)
    draw.text((180, 291), "x = 6", fill=ink_color, font=handwriting_bold)
    
    # Question 2 (INCORRECT - Distributive error)
    draw.text((160, 365), "2) Solve for x:   4(x - 3) = 20", fill=(30, 30, 30), font=question_font)
    draw.text((180, 405), "4x - 7 = 20", fill=ink_color, font=handwriting) # Mistake: 4*3 is 12, kid did 4+3 or forgot to multiply
    draw.text((180, 443), "4x = 20 + 7", fill=ink_color, font=handwriting)
    draw.text((180, 481), "4x = 27", fill=ink_color, font=handwriting)
    draw.text((180, 519), "x = 27 / 4", fill=ink_color, font=handwriting_bold)

    # Question 3 (INCORRECT - Fraction Addition error)
    draw.text((160, 595), "3) Add the fractions:   1/3 + 2/5", fill=(30, 30, 30), font=question_font)
    draw.text((180, 633), "= (1 + 2) / (3 + 5)", fill=ink_color, font=handwriting) # Classic error: added numerators & denominators
    draw.text((180, 671), "= 3 / 8", fill=ink_color, font=handwriting_bold)

    # Question 4 (CORRECT - Negative numbers)
    draw.text((160, 747), "4) Simplify:   (-6) * (-4) + (-5)", fill=(30, 30, 30), font=question_font)
    draw.text((180, 785), "= 24 + (-5)", fill=ink_color, font=handwriting)
    draw.text((180, 823), "= 19", fill=ink_color, font=handwriting_bold)

    # Question 5 (INCORRECT - Order of operations / PEMDAS error)
    draw.text((160, 899), "5) Evaluate:   8 + 2 * (5 - 1)^2", fill=(30, 30, 30), font=question_font)
    draw.text((180, 937), "= 10 * (4)^2", fill=ink_color, font=handwriting) # Mistake: did 8+2 before multiplying!
    draw.text((180, 975), "= 10 * 16", fill=ink_color, font=handwriting)
    draw.text((180, 1013), "= 160", fill=ink_color, font=handwriting_bold)

    img.save(output_path, "PNG")
    print(f"Generated math sheet at {output_path}")

def generate_english_sheet(output_path):
    img = create_lined_paper()
    draw = ImageDraw.Draw(img)
    
    try:
        header_font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 20)
        title_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
        question_font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 22)
        handwriting = ImageFont.truetype(r"C:\Windows\Fonts\Inkfree.ttf", 26)
    except:
        header_font = title_font = question_font = handwriting = ImageFont.load_default()

    # Header
    draw.text((160, 45), "Name: Emma Watson          Date: Nov 15          Grade: 5", fill=(50, 50, 50), font=header_font)
    draw.text((160, 95), "English Grammar & Writing Worksheet", fill=(20, 20, 20), font=title_font)
    draw.line([(160, 130), (840, 130)], fill=(70, 70, 70), width=2)
    
    ink_color = (20, 50, 140)

    # Question 1 (CORRECT)
    draw.text((160, 175), "1) Rewrite with correct capitalization:", fill=(30, 30, 30), font=question_font)
    draw.text((180, 215), "Prompt: we visited london last summer.", fill=(80, 80, 80), font=header_font)
    draw.text((180, 253), "We visited London last summer.", fill=ink_color, font=handwriting)

    # Question 2 (INCORRECT - Subject-verb agreement)
    draw.text((160, 329), "2) Choose the correct verb (was / were):", fill=(30, 30, 30), font=question_font)
    draw.text((180, 367), "Prompt: The basket of fresh apples [was / were] on the counter.", fill=(80, 80, 80), font=header_font)
    draw.text((180, 405), "The basket of fresh apples were on the counter.", fill=ink_color, font=handwriting) # Mistake: "basket was", not "apples were"

    # Question 3 (INCORRECT - Spelling & Homophone error)
    draw.text((160, 481), "3) Correct the spelling and homophone errors in this sentence:", fill=(30, 30, 30), font=question_font)
    draw.text((180, 519), "Prompt: there going to recieve their awards tomorrow.", fill=(80, 80, 80), font=header_font)
    draw.text((180, 557), "Their going to recieve their awards tomorrow.", fill=ink_color, font=handwriting) # Mistakes: "Their" instead of "They're", "recieve" misspelled (ie instead of ei)

    # Question 4 (CORRECT - Punctuation & quotation marks)
    draw.text((160, 633), "4) Add quotation marks and commas correctly:", fill=(30, 30, 30), font=question_font)
    draw.text((180, 671), "Prompt: I love reading books said Marcus.", fill=(80, 80, 80), font=header_font)
    draw.text((180, 709), "\"I love reading books,\" said Marcus.", fill=ink_color, font=handwriting)

    # Question 5 (INCORRECT - Apostrophe of possession)
    draw.text((160, 785), "5) Fix the apostrophe usage in this sentence:", fill=(30, 30, 30), font=question_font)
    draw.text((180, 823), "Prompt: All the dog's collars were hanging by the door.", fill=(80, 80, 80), font=header_font)
    draw.text((180, 861), "All the dogs collar's were hanging by the door.", fill=ink_color, font=handwriting) # Mistake: plural possessive "dogs'" and "collars" has no apostrophe

    img.save(output_path, "PNG")
    print(f"Generated english sheet at {output_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\anand\.gemini\antigravity\scratch\inkgrade-ai\test_sheets"
    os.makedirs(out_dir, exist_ok=True)
    generate_math_sheet(os.path.join(out_dir, "math_grade7_algebra.png"))
    generate_english_sheet(os.path.join(out_dir, "english_grade5_grammar.png"))
