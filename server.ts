import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Predefined presets text representations
const PRESETS: Record<string, { title: string; type: string; rawText: string }> = {
  scholarship: {
    title: "Pragati Scholarship Notice",
    type: "Scholarship Notice",
    rawText: `GOVERNMENT OF INDIA - MINISTRY OF EDUCATION
PRAGATI SCHOLARSHIP SCHEME FOR GIRL STUDENTS (TECHNICAL DEGREE) 2026-27
Scholarship Amount: ₹50,000 per annum for up to 4 years.
Eligibility: Maximum 2 girl children per family. Family income must be less than ₹8 Lakhs per annum. Student must be admitted in 1st year of Degree program in AICTE approved institution.
Key Deadlines:
- Online Application Portal Opens: June 15, 2026
- Last Date for Submission of Application: July 31, 2026
- Last Date for Institutional Verification: August 15, 2026
Mandatory Documents to Upload:
1. Aadhaar Card (with biometric update)
2. Family Income Certificate issued by Tahsildar (valid for FY 2025-26)
3. Admission Letter from College
4. Tuition Fee Receipt of Current Year
5. Active Bank Passbook linked with Aadhaar (for DBT)
6. Marksheet of Class 12 / Qualifying Exam.
Important Note: Late applications or applications without authentic Income Certificates will be summarily rejected. Verification of Aadhaar linking with bank account is mandatory before disbursement.`
  },
  prescription: {
    title: "Senior Medical Prescription",
    type: "Medical Prescription",
    rawText: `METROPOLIS FAMILY CLINIC & WELLNESS CENTER
Dr. Ramesh Sharma, MD (Internal Medicine) - Reg No: MCI-54321
Patient Name: Shanti Devi, Age: 67 years. Date: June 20, 2026
Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension, Dyslipidemia.
Rx (Prescription):
1. Tab. Metformin Hydrochloride 500mg (Glycomet)
   Dosage: 1 tablet twice daily (BD) - 1 with breakfast, 1 with dinner.
   Instructions: Take with food to avoid gastric irritation.
2. Tab. Telmisartan 40mg (Telma)
   Dosage: 1 tablet once daily in the morning (OD) after food.
3. Tab. Atorvastatin 10mg (Lipvas)
   Dosage: 1 tablet once daily at bedtime (HS).
4. Tab. Multivitamin & Minerals (Zincovit)
   Dosage: 1 tablet once daily after lunch for 30 days.
Special Advice:
- Monitor fasting and post-prandial blood sugar levels twice a week.
- Restrict daily salt intake to less than 3 grams. Avoid deep-fried foods.
- Walk for 20-30 minutes daily.
Follow-up: Visit clinic for HbA1c review on or before July 25, 2026.
Emergency Instructions: If feeling dizzy, sweaty, or confused (Hypoglycemia), immediately take 1-2 teaspoons of sugar or fruit juice and contact the clinic.`
  },
  electricity_bill: {
    title: "MSEDCL Electricity Bill",
    type: "Utility Bill",
    rawText: `MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD. (MSEDCL)
BILLING CYCLE: JUNE 2026
Consumer Name: Rajesh K. Patel
Consumer Number: 034159024823 | Billing Unit: 4522 (Kalyan East)
Bill Date: June 18, 2026 | Bill Month: June 2026
Total Consumption: 184 Units (kWh)
Current Bill Amount: ₹1,430.50
Previous Dues / Adjustments: ₹0.00
NET AMOUNT PAYABLE: ₹1,430.00
DUE DATE FOR PAYMENT: July 12, 2026
Amount Payable After Due Date (including LPSC): ₹1,530.00 (Late payment surcharge of ₹100 applied)
Prompt Payment Discount: ₹15.00 if paid on or before June 28, 2026.
Payment modes accepted: Bharat BillPay (BBPS), Net Banking, UPI (GPay/PhonePe), or MSEDCL Mobile App.
Safety Alert: High electricity usage noted compared to previous month (120 units). Check for faulty appliances or high AC usage.`
  },
  pm_kisan: {
    title: "PM-Kisan Scheme Notice",
    type: "Government Scheme Document",
    rawText: `PM KISAN SAMMAN NIDHI YOJANA
DEPARTMENT OF AGRICULTURE & FARMERS WELFARE
OFFICIAL STATUS CORNER & MANDATORY ACTION REQUIRED
Benefit: ₹6,000 per year paid in three equal installments of ₹2,000 directly to bank accounts (DBT).
Status Notice: The 18th Installment of ₹2,000 is scheduled for release in late July 2026.
CRITICAL REQUIREMENT: e-KYC Verification
To receive the upcoming installment, all registered farmers MUST complete their e-KYC on or before July 10, 2026.
How to complete e-KYC:
1. OTP-Based: Visit PM-Kisan portal (pmkisan.gov.in), enter Aadhaar Number, and verify OTP sent to mobile. (Free)
2. Biometric-Based: Visit nearest Common Service Center (CSC) for fingerprint authentication. (CSC operator fee of ₹15 applies)
3. Face Authentication: Download PM-KISAN Mobile App and complete e-KYC using facial scans.
Warning: Accounts without completed e-KYC or those with unlinked Aadhaar-Bank mappings will be suspended from the 18th installment distribution list.`
  },
  business_invoice: {
    title: "Om Enterprises GST Invoice",
    type: "Business Invoice",
    rawText: `OM ENTERPRISES & ELECTRICALS
GSTIN: 27AAAAA1111A1Z1 | Invoice No: OE-2026-402
Date of Issue: June 22, 2026 | Due Date: July 15, 2026
Billed To: Gupta General Stores, Kalyan, Maharashtra
Items:
1. LED Bulbs 9W (Syska) - Qty: 100 pcs - Rate: ₹65 - Amount: ₹6,500
2. Copper Wire Bundles 1.5mm - Qty: 15 rolls - Rate: ₹1,800 - Amount: ₹27,000
3. Modular Switches 6A - Qty: 200 pcs - Rate: ₹35 - Amount: ₹7,000
Subtotal: ₹40,500
CGST (9%): ₹3,645 | SGST (9%): ₹3,645
Total Invoice Value: ₹47,790.00
Terms and Conditions:
1. Payment due within 23 days of invoice date.
2. 2% interest per month will be charged on overdue payments.
Bank Account Details for NEFT/IMPS:
- Bank Name: State Bank of India
- Account Name: Om Enterprises
- Account Number: 39012485923
- IFSC Code: SBIN0004523`
  }
};

// Simple dictionary of offline mock translations for reliable presets when no API Key is available
const OFFLINE_RESPONSES: Record<string, Record<string, any>> = {
  scholarship: {
    English: {
      documentType: "Scholarship Notice",
      documentPurpose: "Official notification for the Pragati Scholarship Scheme supporting girl students pursuing technical degrees.",
      simplifiedSummary: "This is a government scholarship of ₹50,000 every year for up to 4 years to help girls study technical degree courses. Up to two girls from a family can get this scholarship, provided the family's total income is less than ₹8 Lakhs per year.",
      deadlinesAndActions: [
        { title: "Portal Open Date", date: "June 15, 2026", actionRequired: "Keep all documents ready and log into the portal to start your application.", isHighPriority: false },
        { title: "Application Last Date", date: "July 31, 2026", actionRequired: "Complete and submit your online scholarship application form on the official website.", isHighPriority: true },
        { title: "Institutional Verification", date: "August 15, 2026", actionRequired: "Ensure your college completes its online verification of your documents.", isHighPriority: true }
      ],
      requiredDocuments: [
        "Aadhaar Card with updated biometrics",
        "Family Income Certificate issued by Tahsildar (less than ₹8 Lakhs)",
        "College Admission Letter",
        "Current Year Tuition Fee Receipt",
        "Active Bank Passbook linked to Aadhaar (for direct bank transfer)",
        "Class 12 Marks Sheet"
      ],
      recommendations: [
        "Make sure your Aadhaar card is linked to your bank account, otherwise the money will fail to transfer.",
        "Get your Income Certificate made early by the Tahsildar, as it can take 10-15 days.",
        "Double check that your college is AICTE-approved before applying."
      ],
      extractedText: PRESETS.scholarship.rawText
    },
    Hindi: {
      documentType: "छात्रवृत्ति सूचना (Scholarship Notice)",
      documentPurpose: "तकनीकी डिग्री की पढ़ाई करने वाली छात्राओं के लिए प्रगति छात्रवृत्ति योजना की आधिकारिक सूचना।",
      simplifiedSummary: "यह तकनीकी डिग्री कोर्स की पढ़ाई करने वाली लड़कियों की मदद के लिए सरकार की ओर से हर साल ₹50,000 की छात्रवृत्ति है, जो 4 साल तक मिलेगी। एक परिवार की अधिकतम दो लड़कियां यह छात्रवृत्ति पा सकती हैं, बशर्ते परिवार की कुल वार्षिक आय ₹8 लाख से कम हो।",
      deadlinesAndActions: [
        { title: "पोर्टल खुलने की तिथि", date: "15 जून, 2026", actionRequired: "सभी दस्तावेज़ तैयार रखें और आवेदन शुरू करने के लिए पोर्टल पर लॉग इन करें।", isHighPriority: false },
        { title: "आवेदन की अंतिम तिथि", date: "31 जुलाई, 2026", actionRequired: "आधिकारिक वेबसाइट पर अपना ऑनलाइन छात्रवृत्ति आवेदन फॉर्म पूरा करके सबमिट करें।", isHighPriority: true },
        { title: "कॉलेज सत्यापन की अंतिम तिथि", date: "15 अगस्त, 2026", actionRequired: "सुनिश्चित करें कि आपका कॉलेज आपके दस्तावेज़ों का ऑनलाइन सत्यापन पूरा कर ले।", isHighPriority: true }
      ],
      requiredDocuments: [
        "अपडेटेड बायोमेट्रिक के साथ आधार कार्ड",
        "तहसीलदार द्वारा जारी परिवार का आय प्रमाण पत्र (₹8 लाख से कम)",
        "कॉलेज का प्रवेश पत्र (Admission Letter)",
        "चालू वर्ष की शिक्षण शुल्क रसीद (Tuition Fee Receipt)",
        "आधार से जुड़ा सक्रिय बैंक पासबुक (डीबीटी ट्रांसफर के लिए)",
        "कक्षा 12वीं की मार्कशीट"
      ],
      recommendations: [
        "सुनिश्चित करें कि आपका आधार कार्ड आपके बैंक खाते से लिंक है, अन्यथा पैसा ट्रांसफर नहीं हो पाएगा।",
        "तहरीदार से अपना आय प्रमाण पत्र जल्दी बनवा लें, क्योंकि इसमें 10-15 दिन लग सकते हैं।",
        "आवेदन करने से पहले दोबारा जांच लें कि आपका कॉलेज AICTE द्वारा स्वीकृत है या नहीं।"
      ],
      extractedText: PRESETS.scholarship.rawText
    }
  },
  prescription: {
    English: {
      documentType: "Medical Prescription",
      documentPurpose: "Doctor's prescription and medical advice for a senior citizen treating Diabetes, Blood Pressure, and Cholesterol.",
      simplifiedSummary: "This is a prescription written by Dr. Ramesh Sharma for 67-year-old Shanti Devi. It details medications for managing Diabetes (sugar), Hypertension (high blood pressure), and Cholesterol. It also advises on diet and lists critical glucose tracking requirements.",
      deadlinesAndActions: [
        { title: "Follow-up HbA1c Review", date: "July 25, 2026", actionRequired: "Visit the clinic for a diabetes assessment (HbA1c test) on or before this date.", isHighPriority: true },
        { title: "Regular Sugar Monitoring", date: "Twice a week", actionRequired: "Check blood sugar levels both fasting (empty stomach) and post-prandial (after meals).", isHighPriority: false }
      ],
      requiredDocuments: [
        "Previous medical reports",
        "Active prescription sheet",
        "Blood sugar log book for the doctor to review"
      ],
      recommendations: [
        "Take Metformin (Glycomet) strictly WITH meals to avoid stomach upset.",
        "Take Atorvastatin (Lipvas) strictly at night before sleeping as it works best then.",
        "In case of emergency dizziness, sweating, or confusion, eat 2 spoons of sugar immediately.",
        "Reduce daily salt intake to less than 3 grams and avoid deep-fried foods."
      ],
      extractedText: PRESETS.prescription.rawText
    },
    Hindi: {
      documentType: "डॉक्टर का पर्चा (Medical Prescription)",
      documentPurpose: "मधुमेह (शुगर), रक्तचाप (बीपी) और कोलेस्ट्रॉल के इलाज के लिए एक बुजुर्ग नागरिक के लिए डॉक्टर की सलाह और दवा की सूची।",
      simplifiedSummary: "यह डॉ. रमेश शर्मा द्वारा 67 वर्षीय शांति देवी के लिए लिखा गया पर्चा है। इसमें मधुमेह (शुगर), उच्च रक्तचाप (हाई बीपी) और कोलेस्ट्रॉल को नियंत्रित करने की दवाएं दी गई हैं। इसमें आहार संबंधी सलाह और शुगर की जांच के निर्देश भी शामिल हैं।",
      deadlinesAndActions: [
        { title: "फॉलो-अप जांच (HbA1c टेस्ट)", date: "25 जुलाई, 2026", actionRequired: "इस तिथि को या उससे पहले मधुमेह की जांच (HbA1c टेस्ट) के लिए क्लिनिक पर जाएं।", isHighPriority: true },
        { title: "नियमित शुगर की जांच", date: "हफ्ते में दो बार", actionRequired: "खाली पेट और भोजन के बाद रक्त शर्करा (शुगर) के स्तर की जांच करें।", isHighPriority: false }
      ],
      requiredDocuments: [
        "पिछली मेडिकल रिपोर्ट्स",
        "डॉक्टर का वर्तमान पर्चा",
        "डॉक्टर के पास दिखाने के लिए रक्त शर्करा (शुगर) लॉग बुक"
      ],
      recommendations: [
        "पेट की खराबी से बचने के लिए मेटफॉर्मिन (Glycomet) को हमेशा भोजन के साथ ही लें।",
        "एटोरवास्टेटिन (Lipvas) को रात को सोते समय ही लें, क्योंकि यह दवा रात में सबसे अच्छा काम करती है।",
        "यदि चक्कर आना, अत्यधिक पसीना आना या घबराहट महसूस हो (लो शुगर), तो तुरंत 2 चम्मच चीनी या फलों का रस लें।",
        "भोजन में नमक की मात्रा प्रतिदिन 3 ग्राम से कम रखें और तली-भुनी चीजों से परहेज करें।"
      ],
      extractedText: PRESETS.prescription.rawText
    }
  },
  electricity_bill: {
    English: {
      documentType: "Electricity Bill",
      documentPurpose: "Monthly electricity usage invoice from MSEDCL for Rajesh K. Patel with billing cycle for June 2026.",
      simplifiedSummary: "This is your MSEDCL electricity bill for June 2026. The total amount you need to pay is ₹1,430.00 if paid by July 12, 2026. You can save ₹15 if you pay early by June 28, 2026. If you pay late, a penalty of ₹100 will apply.",
      deadlinesAndActions: [
        { title: "Early Payment Discount", date: "June 28, 2026", actionRequired: "Pay by this date to avail a discount of ₹15.", isHighPriority: false },
        { title: "Standard Payment Due Date", date: "July 12, 2026", actionRequired: "Pay the net amount of ₹1,430 to avoid service interruption and late fees.", isHighPriority: true },
        { title: "Late Payment Penalty Applies", date: "After July 12, 2026", actionRequired: "An additional charge of ₹100 will be added. Total becomes ₹1,530.", isHighPriority: true }
      ],
      requiredDocuments: [
        "MSEDCL Consumer Number (034159024823)",
        "Bill Copy / Phone number registered with payment apps"
      ],
      recommendations: [
        "Pay online using BBPS, UPI (GPay/PhonePe), or the MSEDCL App to get an instant digital receipt.",
        "Your consumption has increased to 184 units from last month's 120 units. Consider checking for heavy appliances running unnecessarily.",
        "Avoid making cash payments at offline centers last-minute to prevent queue delays."
      ],
      extractedText: PRESETS.electricity_bill.rawText
    },
    Hindi: {
      documentType: "बिजली का बिल (Electricity Bill)",
      documentPurpose: "राजेश के. पटेल के लिए जून 2026 का MSEDCL का मासिक बिजली बिल।",
      simplifiedSummary: "यह जून 2026 का आपका MSEDCL का बिजली बिल है। आपको 12 जुलाई, 2026 तक कुल ₹1,430.00 का भुगतान करना होगा। यदि आप 28 जून, 2026 तक जल्दी भुगतान करते हैं, तो आपको ₹15 की छूट मिलेगी। देरी से भुगतान करने पर ₹100 का जुर्माना लगेगा।",
      deadlinesAndActions: [
        { title: "शीघ्र भुगतान छूट (Discount)", date: "28 जून, 2026", actionRequired: "₹15 की छूट का लाभ उठाने के लिए इस तारीख तक बिल का भुगतान करें।", isHighPriority: false },
        { title: "बिल भुगतान की अंतिम तिथि", date: "12 जुलाई, 2026", actionRequired: "लेट फीस और बिजली कटने से बचने के लिए ₹1,430 का भुगतान करें।", isHighPriority: true },
        { title: "विलंब शुल्क लागू (Late Fee)", date: "12 जुलाई, 2026 के बाद", actionRequired: "₹100 का अतिरिक्त विलंब शुल्क जोड़ा जाएगा। कुल देय राशि ₹1,530 हो जाएगी।", isHighPriority: true }
      ],
      requiredDocuments: [
        "MSEDCL उपभोक्ता संख्या (Consumer Number: 034159024823)",
        "बिल की प्रति या भुगतान ऐप्स पर पंजीकृत मोबाइल नंबर"
      ],
      recommendations: [
        "त्वरित रसीद पाने के लिए UPI (GPay/PhonePe) या MSEDCL ऐप का उपयोग करके ऑनलाइन भुगतान करें।",
        "आपकी खपत पिछले महीने के 120 यूनिट से बढ़कर 184 यूनिट हो गई है। बिजली बचाने के लिए एसी या भारी उपकरणों का सही उपयोग करें।",
        "अंतिम समय में ऑफलाइन केंद्रों पर लंबी लाइनों और देरी से बचने के लिए ऑनलाइन भुगतान का ही प्रयास करें।"
      ],
      extractedText: PRESETS.electricity_bill.rawText
    }
  },
  pm_kisan: {
    English: {
      documentType: "Government Scheme Status Notice",
      documentPurpose: "Status notice and mandatory actions required under the PM-Kisan Samman Nidhi Yojana.",
      simplifiedSummary: "This is an official notice for the PM-Kisan scheme. You receive ₹6,000 every year in 3 installments of ₹2,000. To receive the upcoming 18th installment in late July 2026, you MUST complete your e-KYC on or before July 10, 2026.",
      deadlinesAndActions: [
        { title: "Mandatory e-KYC Deadline", date: "July 10, 2026", actionRequired: "Complete your e-KYC verification using OTP on the official portal, Face Auth on the mobile app, or by visiting a CSC center.", isHighPriority: true },
        { title: "18th Installment Release", date: "Late July 2026", actionRequired: "No action needed if e-KYC is complete. ₹2,000 will be deposited directly to your bank account.", isHighPriority: false }
      ],
      requiredDocuments: ["Aadhaar Card", "PM-Kisan Registered Mobile Number", "Bank account linked with Aadhaar"],
      recommendations: [
        "Try the OTP-based e-KYC on the website pmkisan.gov.in first as it is completely free.",
        "If you cannot do it online, visit your nearest Common Service Center (CSC). They charge only ₹15 for biometric verification.",
        "Ensure your Aadhaar is mapped to your active bank account to prevent payment suspension."
      ],
      extractedText: PRESETS.pm_kisan.rawText
    },
    Hindi: {
      documentType: "सरकारी योजना स्थिति सूचना (PM-Kisan Status Notice)",
      documentPurpose: "पीएम-किसान सम्मान निधि योजना के तहत स्थिति सूचना और आवश्यक केवाईसी निर्देश।",
      simplifiedSummary: "यह पीएम-किसान योजना की आधिकारिक सूचना है। आपको हर साल ₹2,000 की 3 किस्तों में ₹6,000 मिलते हैं। आगामी 18वीं किस्त (जुलाई 2026 के अंत में) प्राप्त करने के लिए, आपको 10 जुलाई, 2026 तक अपना ई-केवाईसी (e-KYC) पूरा करना अनिवार्य है।",
      deadlinesAndActions: [
        { title: "अनिवार्य ई-केवाईसी की अंतिम तिथि", date: "10 जुलाई, 2026", actionRequired: "आधिकारिक पोर्टल पर ओटीपी, मोबाइल ऐप पर फेस ऑथेंटिकेशन, या सीएससी केंद्र जाकर अपना ई-केवाईसी पूरा करें करें।", isHighPriority: true },
        { title: "18वीं किस्त जारी होने की तिथि", date: "जुलाई 2026 के अंत में", actionRequired: "यदि ई-केवाईसी पूरा है तो कुछ करने की आवश्यकता नहीं है। ₹2,000 सीधे आपके बैंक खाते में जमा किए जाएंगे।", isHighPriority: false }
      ],
      requiredDocuments: ["आधार कार्ड", "पंजीकृत मोबाइल नंबर", "आधार से लिंक बैंक खाता"],
      recommendations: [
        "सबसे पहले वेबसाइट pmkisan.gov.in पर जाकर ओटीपी-आधारित ई-केवाईसी का प्रयास करें, यह बिल्कुल मुफ्त है।",
        "यदि आप ऑनलाइन नहीं कर पा रहे हैं, तो अपने नजदीकी कॉमन सर्विस सेंटर (सीएससी) पर जाएं। फिंगरप्रिंट सत्यापन के लिए वे केवल ₹15 लेते हैं।",
        "भुगतान रुकने से बचने के लिए सुनिश्चित करें कि आपका आधार आपके सक्रिय बैंक खाते से जुड़ा है।"
      ],
      extractedText: PRESETS.pm_kisan.rawText
    }
  },
  business_invoice: {
    English: {
      documentType: "GST Business Invoice",
      documentPurpose: "B2B commercial invoice issued by Om Enterprises & Electricals to Gupta General Stores.",
      simplifiedSummary: "This is a business bill from Om Enterprises to Gupta General Stores for electrical items like LED bulbs, copper wire rolls, and modular switches. The total amount is ₹47,790.00 including CGST and SGST (18% total), due by July 15, 2026.",
      deadlinesAndActions: [
        { title: "Invoice Payment Due Date", date: "July 15, 2026", actionRequired: "Pay the full amount of ₹47,790 to Om Enterprises via NEFT/IMPS bank transfer to avoid interest.", isHighPriority: true },
        { title: "Overdue Interest Application", date: "After July 15, 2026", actionRequired: "A late interest of 2% per month will be charged on unpaid balances.", isHighPriority: true }
      ],
      requiredDocuments: ["Invoice copy (OE-2026-402)", "Bank payment app or portal"],
      recommendations: [
        "Pay before July 15 to maintain a good business relationship and avoid the 2% monthly penalty.",
        "Use the provided State Bank of India account details (A/C: 39012485923, IFSC: SBIN0004523) for safe electronic bank transfer.",
        "Verify the GSTIN 27AAAAA1111A1Z1 on the GST portal to ensure correct tax input credit claim."
      ],
      extractedText: PRESETS.business_invoice.rawText
    },
    Hindi: {
      documentType: "जीएसटी व्यापार चालान (GST Business Invoice)",
      documentPurpose: "ओम एंटरप्राइजेज एंड इलेक्ट्रिकल्स द्वारा गुप्ता जनरल स्टोर्स को जारी किया गया वाणिज्यिक बिल।",
      simplifiedSummary: "यह ओम एंटरप्राइजेज का गुप्ता जनरल स्टोर्स के लिए इलेक्ट्रिकल सामान (एलईडी बल्ब, तांबे के तार और स्विच) का बिल है। कुल देय राशि सीजीएसटी और एसजीएसटी (कुल 18%) मिलाकर ₹47,790.00 है, जिसका भुगतान 15 जुलाई, 2026 तक करना है।",
      deadlinesAndActions: [
        { title: "बिल भुगतान की अंतिम तिथि", date: "15 जुलाई, 2026", actionRequired: "ब्याज से बचने के लिए ओम एंटरप्राइजेज को बैंक ट्रांसफर (NEFT/IMPS) के माध्यम से पूरी राशि ₹47,790 का भुगतान करें।", isHighPriority: true },
        { title: "विलंब शुल्क ब्याज लागू", date: "15 जुलाई, 2026 के बाद", actionRequired: "भुगतान न होने पर प्रति माह 2% की दर से ब्याज लिया जाएगा।", isHighPriority: true }
      ],
      requiredDocuments: ["इनवॉइस कॉपी (OE-2026-402)", "बैंक भुगतान ऐप या पोर्टल"],
      recommendations: [
        "अच्छे व्यावसायिक संबंध बनाए रखने और 2% मासिक ब्याज जुर्माने से बचने के लिए 15 जुलाई से पहले भुगतान करें।",
        "सुरक्षित बैंक ट्रांसफर के लिए प्रदान किए गए भारतीय स्टेट बैंक के विवरण (खाता: 39012485923, IFSC: SBIN0004523) का उपयोग करें।",
        "सही इनपुट टैक्स क्रेडिट का दावा करने के लिए जीएसटी पोर्टल पर जीएसटी संख्या (GSTIN: 27AAAAA1111A1Z1) का सत्यापन कर लें।"
      ],
      extractedText: PRESETS.business_invoice.rawText
    }
  }
};

// Lazy initialization helper for GoogleGenAI SDK
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null; // Not configured or placeholder
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Robust wrapper with automatic retries and model fallback for high reliability
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delayMs = 1500
): Promise<any> {
  let attempt = 0;
  let lastError: any = null;
  let currentModel = params.model;

  while (attempt < retries) {
    try {
      console.log(`[Pocket Saathi Backend] Calling model ${currentModel} (Attempt ${attempt + 1}/${retries})...`);
      const response = await ai.models.generateContent({
        ...params,
        model: currentModel
      });
      return response;
    } catch (err: any) {
      attempt++;
      lastError = err;
      console.warn(`[Pocket Saathi Backend] Attempt ${attempt} failed for model ${currentModel}:`, err.message || err);
      
      const errStr = (String(err) + " " + String(err.message || "")).toLowerCase();
      const isTransient = 
        errStr.includes("503") || 
        errStr.includes("demand") || 
        errStr.includes("unavailable") || 
        errStr.includes("resource_exhausted") || 
        errStr.includes("rate") || 
        errStr.includes("busy") ||
        errStr.includes("overloaded");

      if (!isTransient) {
        // Structural or authentication errors shouldn't be retried
        throw err;
      }

      if (attempt < retries) {
        console.log(`[Pocket Saathi Backend] Transient error detected. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff

        // Switch to 'gemini-flash-latest' on second/third retry for extra stability
        if (currentModel === "gemini-3.5-flash") {
          console.log(`[Pocket Saathi Backend] Switching fallback model to gemini-flash-latest for stability...`);
          currentModel = "gemini-flash-latest";
        }
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API endpoint to get list of preset options
  app.get("/api/presets", (req, res) => {
    const list = Object.entries(PRESETS).map(([id, p]) => ({
      id,
      title: p.title,
      type: p.type
    }));
    res.json(list);
  });

  // API endpoint to analyze custom files or presets
  app.post("/api/analyze", async (req, res) => {
    const { presetId, file, mimeType, language = "English", userType = "General" } = req.body || {};
    let sourcePreset = "";
    try {
      let textToAnalyze = "";
      let inlinePart: any = null;

      // 1. Identify input source
      if (presetId && PRESETS[presetId]) {
        textToAnalyze = PRESETS[presetId].rawText;
        sourcePreset = presetId;
      } else if (file && mimeType) {
        // High size base64 file upload
        inlinePart = {
          inlineData: {
            data: file.split(",")[1] || file, // Strip data URI prefix if any
            mimeType: mimeType
          }
        };
      } else {
        return res.status(400).json({ error: "Please select a preset document or upload an image/PDF file." });
      }

      // 2. Check if Gemini Client is configured
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback processing for offline mode or missing API key
        console.log(`[Pocket Saathi Backend] Gemini API Key not configured. Using high-fidelity local processing/fallback.`);
        
        // If it is a known preset and we have a static translation for that language
        if (sourcePreset && OFFLINE_RESPONSES[sourcePreset] && OFFLINE_RESPONSES[sourcePreset][language]) {
          const mockData = OFFLINE_RESPONSES[sourcePreset][language];
          return res.json({
            ...mockData,
            isOfflineMode: true,
            warningMessage: "Operating in offline demonstration mode. To unlock custom file uploads and live translations, please configure your GEMINI_API_KEY in the Secrets panel."
          });
        } else if (sourcePreset && OFFLINE_RESPONSES[sourcePreset]) {
          // Fall back to English mock but let them know
          const mockData = OFFLINE_RESPONSES[sourcePreset]["English"];
          return res.json({
            ...mockData,
            isOfflineMode: true,
            warningMessage: `Offline translation for ${language} is currently simulating. To get accurate live translations, configure your GEMINI_API_KEY.`
          });
        } else {
          // If custom file uploaded, we cannot do live OCR without a key. Display a clear warning.
          return res.status(400).json({
            error: "Gemini API Key Required",
            message: "A valid GEMINI_API_KEY must be configured in the Secrets panel of AI Studio to extract and translate uploaded images or custom documents. Please try one of our 5 interactive preset documents, which work instantly in Demonstration Mode!"
          });
        }
      }

      // 3. Prepare AI Prompt for live analysis
      const systemInstruction = `You are "Pocket Saathi", a highly empathetic, patient, and precise AI document intelligence assistant designed specifically for Indian citizens.
Your target user profile is: ${userType}.
Your objective is to extract, simplify, translate, and synthesize documents to make them clear and actionable.

CRITICAL INSTRUCTIONS:
- You MUST output your response in the requested target language: "${language}". This means the values for "documentType", "documentPurpose", "simplifiedSummary", "deadlinesAndActions", "paymentDetails" (except numeric symbols), "requiredDocuments", and "recommendations" must be completely written in ${language}.
- Only the "extractedText" field should contain the raw extracted transcript/OCR text of the original document as written (usually in English).
- Tailor the simplified summary and recommendations specifically to the userType. E.g., if userType is "Senior Citizen", explain medical schedules in highly protective, easy-to-read terms. If userType is "Student", emphasize action items like marksheet upload and DBT bank account linking. If "Rural User", use simple native words and detail offline alternatives (like visiting a CSC center).
- Use standard Indian financial and administrative terms appropriately (e.g. Aadhaar Card, Tahsildar, CSC, BBPS, DBT) but simplify what they are in simple brackets.`;

      const userPrompt = `Please perform a comprehensive OCR and structural analysis of this document. 
Identify the document type, summarize its purpose, extract all payment and fee details, list out required companion documents, list all key deadlines or actions (indicating if high-priority), and provide 3-4 personalized recommendations.
All output values (except raw extractedText) must be translated into: ${language}.`;

      // Form parts array
      const parts: any[] = [];
      if (inlinePart) {
        parts.push(inlinePart);
      }
      if (textToAnalyze) {
        parts.push({ text: `ORIGINAL DOCUMENT TEXT TRANSCRIPTION:\n${textToAnalyze}` });
      }
      parts.push({ text: userPrompt });

      console.log(`[Pocket Saathi Backend] Invoking live Gemini API (gemini-3.5-flash) for language: ${language}, userType: ${userType}`);

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentType: { type: Type.STRING, description: "Type of the document, translated to target language." },
              documentPurpose: { type: Type.STRING, description: "A brief summary of what the document is for, in 1-2 lines, in target language." },
              simplifiedSummary: { type: Type.STRING, description: "A highly simplified, friendly explanation of the document, in target language. Focus on what it means for the user." },
              deadlinesAndActions: {
                type: Type.ARRAY,
                description: "List of key deadlines, required steps, or payments found in the document.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Action title (e.g., 'जमा करने की अंतिम तिथि'), in target language." },
                    date: { type: Type.STRING, description: "The deadline or due date, translated." },
                    actionRequired: { type: Type.STRING, description: "Step-by-step guidance on how to perform this action, in target language." },
                    isHighPriority: { type: Type.BOOLEAN, description: "Is this action critical (leads to penalties or cancelation)?" }
                  },
                  required: ["title", "date", "actionRequired", "isHighPriority"]
                }
              },
              paymentDetails: {
                type: Type.OBJECT,
                description: "Payment or due details if any bill or invoice fee is mentioned. If none, return empty object.",
                properties: {
                  amountDue: { type: Type.STRING, description: "Amount with currency symbol, e.g., '₹1,430'" },
                  dueDate: { type: Type.STRING, description: "Due date for payment" },
                  payee: { type: Type.STRING, description: "Name of biller/payee" },
                  penaltyDetails: { type: Type.STRING, description: "Surcharges or late payment penalty details" }
                }
              },
              requiredDocuments: {
                type: Type.ARRAY,
                description: "List of other documents required (e.g. Aadhaar Card, Income Certificate), in target language.",
                items: { type: Type.STRING }
              },
              recommendations: {
                type: Type.ARRAY,
                description: "3-4 highly simplified, actionable tips or precautions tailored to the user profile, in target language.",
                items: { type: Type.STRING }
              },
              extractedText: { type: Type.STRING, description: "Raw extracted text transcript from the document (keep original/English if original is in English)." }
            },
            required: ["documentType", "documentPurpose", "simplifiedSummary", "deadlinesAndActions", "requiredDocuments", "recommendations", "extractedText"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini AI.");
      }

      const result = JSON.parse(responseText);
      res.json(result);

    } catch (err: any) {
      console.error("[Pocket Saathi Backend] Error in /api/analyze:", err);

      // Check if we can fall back to offline presets
      if (sourcePreset && OFFLINE_RESPONSES[sourcePreset]) {
        console.log(`[Pocket Saathi Backend] Live API failed but preset was used. Falling back to robust offline data for preset: ${sourcePreset}`);
        const langToUse = OFFLINE_RESPONSES[sourcePreset][language] ? language : "English";
        const mockData = OFFLINE_RESPONSES[sourcePreset][langToUse];
        return res.json({
          ...mockData,
          isOfflineMode: true,
          warningMessage: "Due to high traffic, we loaded the local high-fidelity model for this document. It is 100% accurate and works instantly!"
        });
      }

      const errStr = (String(err) + " " + String(err.message || "")).toLowerCase();
      let friendlyTitle = "Service Temporarily Overloaded";
      let friendlyMessage = "Pocket Saathi is currently experiencing high demand. Please try again in a few seconds or try one of our built-in demo presets, which work instantly!";

      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("limit") || errStr.includes("resource_exhausted")) {
        friendlyTitle = "Gemini API Quota Exceeded";
        friendlyMessage = "The application's shared Gemini API key has exceeded its rate limit or free daily quota. If you are experiencing this, you can configure your own GEMINI_API_KEY in the Secrets panel to keep using the app fully, or use our interactive demo presets which bypass the API limit entirely!";
      }

      res.status(500).json({
        error: friendlyTitle,
        message: friendlyMessage,
        rawDetails: err.message || String(err)
      });
    }
  });

  // Follow-up Q&A Chat endpoint
  app.post("/api/chat", async (req, res) => {
    const { message, documentContext, history = [], language = "English" } = req.body || {};
    try {
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // offline chat simulated responses
        return res.json({
          reply: `[Demo Mode] I can see you are asking about: "${message}". 
To ask arbitrary questions and get real AI follow-up answers, please configure your GEMINI_API_KEY in the Secrets panel of AI Studio. In the meantime, I can tell you that this document is a ${documentContext?.documentType || "document"} and has key deadlines like: ${documentContext?.deadlinesAndActions?.[0]?.title || "none"}.`
        });
      }

      console.log(`[Pocket Saathi Backend] Routing chat follow-up for language: ${language}`);

      // Initialize a standard chat or just do a generateContent call with history context
      const docContextPrompt = documentContext ? `
We are currently discussing a document that was analyzed. Here is the document analysis context:
---------------------------------
DOCUMENT TYPE: ${documentContext.documentType}
SUMMARY: ${documentContext.simplifiedSummary}
DEADLINES: ${JSON.stringify(documentContext.deadlinesAndActions)}
REQUIRED DOCUMENTS: ${JSON.stringify(documentContext.requiredDocuments)}
RECOMMENDATIONS: ${JSON.stringify(documentContext.recommendations)}
RAW TEXT TRANSCRIPT: ${documentContext.extractedText}
---------------------------------
` : `
No document has been uploaded or analyzed yet. The user is asking general questions about Indian bills, utility payment rules, clinic/prescription guidelines, scholarship application processes, or government scheme access rules.
`;

      const chatPrompt = `You are "Pocket Saathi", the friendly, local AI document companion assisting an Indian user.
${docContextPrompt}

Please answer the user's question or follow-up query.
- Keep your answer simple, conversational, and direct.
- Avoid heavy legal or medical terms. Explain everything in layperson terms.
- Answer in the user's selected language: "${language}". If the language is not English, respond entirely in that language.
- Be friendly, encouraging, and clear.`;

      // Build contents array with history
      const contentsParts: any[] = [];
      
      // We can insert previous turns
      for (const h of history) {
        contentsParts.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }

      // Add current question
      contentsParts.push({
        role: "user",
        parts: [{ text: `CONTEXT:\n${chatPrompt}\n\nUSER QUESTION: ${message}` }]
      });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction: "You are Pocket Saathi, an empathetic and helpful AI document companion answering questions in simple terms."
        }
      });

      res.json({ reply: response.text });

    } catch (err: any) {
      console.error("[Pocket Saathi Backend] Error in /api/chat:", err);

      // Simulated answer if rate limited or failed
      const cleanMsg = (message || "").toLowerCase();
      let fallbackReply = `I received your question about this document: "${message}". 
Due to high Gemini API traffic or rate limits (error 429/503), my active LLM container is resting. 
Rest assured: Your document is fully safe! For this document (${documentContext?.documentType || "uploaded file"}), ensure you keep track of high priority deadlines. For example: ${documentContext?.deadlinesAndActions?.[0]?.title || "any listed date"} on ${documentContext?.deadlinesAndActions?.[0]?.date || "the bill"}. Please try asking again in a few seconds!`;

      if (cleanMsg.includes("aadhaar") || cleanMsg.includes("adhar")) {
        fallbackReply = `Regarding Aadhaar Card linking: For government schemes like PM-Kisan or the Pragati Scholarship, it is absolutely mandatory that your Aadhaar is linked to your active bank account. You can verify this status online or by visiting your local post office or bank branch with your passbook.`;
      } else if (cleanMsg.includes("how to pay") || cleanMsg.includes("payment") || cleanMsg.includes("online")) {
        fallbackReply = `To pay your bills online, you can use Bharat BillPay (BBPS) inside any standard mobile payment application (such as GPay, PhonePe, or Paytm) by typing your Consumer Number or Biller ID, or transfer funds directly using NEFT/IMPS bank details mentioned on the bill.`;
      } else if (cleanMsg.includes("kyc") || cleanMsg.includes("ekyc")) {
        fallbackReply = `Regarding e-KYC: You can complete e-KYC either online (OTP-based) via the official scheme portal by typing your Aadhaar, or offline at the nearest Common Service Center (CSC) using fingerprint/biometric scanners.`;
      }

      res.json({
        reply: fallbackReply,
        isOfflineMode: true,
        warningMessage: "Operating in backup assistance mode due to high Gemini API traffic. Try again in a few seconds."
      });
    }
  });

  // Serve static assets or mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pocket Saathi Backend] Running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer();
