import { ROUTES, SITE } from '@/lib/site';

/**
 * Long-form legal copy, carried over verbatim from the original site.
 * Inline markup supported by `<RichText />`: `**bold**` and `[label](href)`.
 */

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'h3'; text: string };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  path: string;
  /** Shown under the title, e.g. an effective date. */
  meta?: string;
  intro?: string[];
  sections: LegalSection[];
}

const MAIL = `[${SITE.supportEmail}](mailto:${SITE.supportEmail})`;

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: 'terms-of-service',
  title: 'Terms of Service',
  path: ROUTES.terms,
  sections: [
    {
      heading: '0. Definitions',
      blocks: [
        { type: 'p', text: 'The following definitions apply throughout these Terms of Service:' },
        {
          type: 'ul',
          items: [
            '**"Booking"** means a confirmed reservation for a transfer service made through the AeroTAXI website or any associated platform.',
            '**"Customer"** means the person who makes the booking and/or any passenger(s) travelling under that booking.',
            '**"Supplier"** (also referred to as **"Principal"**) means the licensed transport operator who provides the actual transfer service.',
            '**"Service"** means the airport transfer, point-to-point transfer, or any other ground transportation service booked through AeroTAXI.',
            '**"Force Majeure"** means any event beyond the reasonable control of either party, including but not limited to acts of God, war, terrorism, pandemic, epidemic, natural disasters, severe weather conditions, government actions, strikes, civil unrest, or any other unforeseeable circumstances.',
            '**"Card Processing Fees"** means the non-refundable fees charged by our payment processor (Stripe) for handling card transactions, which may range from 1.4% to 5.3% depending on the card type and issuing country.',
          ],
        },
      ],
    },
    {
      heading: '1. Introduction',
      blocks: [
        {
          type: 'p',
          text: 'These Terms of Service govern your use of the AeroTAXI website and any services booked through it. AeroTAXI is operated by **AeroTAXI LLC**, a limited liability company registered in the State of Delaware, United States, with File Number **10104688**.',
        },
        {
          type: 'p',
          text: `Our registered address is: **${SITE.address.inline}**.`,
        },
        {
          type: 'p',
          text: 'AeroTAXI acts as an **agent** connecting customers with licensed, independent transport suppliers. We do not own or operate any vehicles ourselves. When you make a booking through our platform, your contract for the provision of the transport service is with the supplier, not with AeroTAXI.',
        },
        {
          type: 'p',
          text: 'By using our website and/or making a booking, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our services.',
        },
      ],
    },
    {
      heading: '2. Your Role as Customer',
      blocks: [
        { type: 'p', text: 'By making a booking with AeroTAXI, you confirm that:' },
        {
          type: 'ul',
          items: [
            'You are at least **18 years of age** and have the legal capacity to enter into a binding agreement.',
            'You consent to these Terms of Service on behalf of all passengers included in your booking.',
            'You accept **financial responsibility** for all charges associated with the booking, including any additional costs arising from changes, cancellations, or extra services requested.',
            'You understand that it is your responsibility to arrange appropriate **travel insurance** to cover any unforeseen circumstances that may affect your journey.',
            'All information provided during the booking process is accurate and complete. AeroTAXI shall not be held liable for any issues arising from incorrect or incomplete information provided by the customer.',
          ],
        },
      ],
    },
    {
      heading: '3. Contractual Relationship',
      blocks: [
        {
          type: 'p',
          text: 'AeroTAXI acts solely as an intermediary agent between the customer and the transport supplier. Your contract for the transfer service is directly with the **supplier** (the licensed transport operator who fulfils the journey).',
        },
        {
          type: 'p',
          text: "While we take reasonable steps to ensure that our suppliers meet high standards of service, AeroTAXI's liability is **limited to the role of an agent**. We shall not be held liable for any loss, damage, injury, delay, or inconvenience caused by the supplier during the provision of the transport service.",
        },
        {
          type: 'p',
          text: "In any event, AeroTAXI's total liability shall not exceed the total amount paid by the customer for the specific booking in question.",
        },
      ],
    },
    {
      heading: '4. Payment',
      blocks: [
        {
          type: 'p',
          text: 'All payments are processed securely through **Stripe**, a PCI-DSS compliant payment processor. AeroTAXI does not store your full credit or debit card details on our servers.',
        },
        {
          type: 'p',
          text: 'Payment is required at the time of booking. By providing your card details, you authorise AeroTAXI to charge the full amount of the booking, including any applicable card processing fees.',
        },
        {
          type: 'p',
          text: '**Card Processing Fees:** Depending on your card type and issuing country, a card processing fee of between **1.4% and 5.3%** may be applied to your transaction. These fees are charged by our payment processor and are non-refundable, even in the event of a cancellation.',
        },
        {
          type: 'p',
          text: 'All prices displayed on our website are inclusive of VAT where applicable. Currency conversion fees may apply if your card is issued in a currency different from the displayed price.',
        },
      ],
    },
    {
      heading: '5. Cancellations',
      blocks: [
        {
          type: 'p',
          text: 'Customers may cancel their booking free of charge up to **24 hours** before the scheduled pick-up time or flight arrival time. Cancellations made within 24 hours of the scheduled pick-up time are non-refundable.',
        },
        {
          type: 'p',
          text: `To cancel a booking, you may use the "My Booking" section on our website or contact our support team at ${MAIL}.`,
        },
        {
          type: 'p',
          text: 'Approved refunds will be processed to the original payment method within **5 to 14 business days**, depending on your card issuer. Please note that card processing fees are non-refundable.',
        },
        {
          type: 'p',
          text: 'If AeroTAXI or the supplier cancels a booking due to operational reasons (other than Force Majeure), the customer will receive a full refund including any card processing fees.',
        },
      ],
    },
    {
      heading: '6. Pricing',
      blocks: [
        {
          type: 'p',
          text: 'All prices quoted on the AeroTAXI website are fixed and include the following where applicable:',
        },
        {
          type: 'ul',
          items: [
            'Waiting time of up to **30 minutes** for airport pickups (calculated from the actual flight landing time) and up to **15 minutes** for non-airport pickups.',
            'Road tolls, congestion charges, and parking fees ordinarily incurred on the route.',
            'Meet and greet service at the airport (where specified).',
          ],
        },
        {
          type: 'p',
          text: 'Additional charges may apply for excessive waiting time beyond the included allowance, route changes requested by the passenger, or additional stops not included in the original booking. Any such charges will be communicated to the customer prior to being applied where reasonably possible.',
        },
      ],
    },
    {
      heading: '7. Pets',
      blocks: [
        {
          type: 'p',
          text: 'Customers wishing to travel with pets **must inform AeroTAXI at the time of booking**. Failure to do so may result in the supplier refusing to carry the animal, and no refund will be given in such circumstances.',
        },
        {
          type: 'p',
          text: 'All pets must travel in a suitable **pet carrier** that is secure and appropriate for the size of the animal. Service animals (e.g., guide dogs) are exempt from the carrier requirement but must still be declared at the time of booking. The customer is responsible for any damage caused by their pet to the vehicle.',
        },
      ],
    },
    {
      heading: '8. Travel Planning',
      blocks: [
        {
          type: 'p',
          text: 'We recommend that customers allow sufficient time for their journey. As a general guideline, passengers should aim to arrive at the airport at least **2 hours before** a domestic flight and **3 hours before** an international flight.',
        },
        {
          type: 'p',
          text: 'Journey times displayed on our website are **estimated** and based on typical traffic conditions. Actual journey times may vary due to traffic, weather, roadworks, or other factors beyond our control. AeroTAXI and its suppliers shall not be held liable for missed flights or connections resulting from traffic delays or other unforeseeable circumstances.',
        },
      ],
    },
    {
      heading: '9. Special Requests',
      blocks: [
        {
          type: 'p',
          text: 'AeroTAXI will endeavour to accommodate special requests, including but not limited to:',
        },
        {
          type: 'ul',
          items: [
            '**Child seats:** We offer complimentary child seats (infant, child, and booster) upon request. Please specify the type and number of child seats required at the time of booking.',
            '**Accessibility requirements:** If you or any passenger requires wheelchair-accessible transport or has any mobility needs, please inform us at the time of booking so we can arrange a suitable vehicle.',
          ],
        },
        {
          type: 'p',
          text: 'While we make every effort to fulfil special requests, they are subject to availability and cannot be guaranteed. We recommend making any special requests as early as possible.',
        },
      ],
    },
    {
      heading: '10. Vehicle Descriptions',
      blocks: [
        {
          type: 'p',
          text: 'Vehicle images and descriptions shown on the AeroTAXI website are for **illustrative purposes only**. The actual vehicle provided may differ in make, model, or colour from the images shown, but will be of the same category and standard (e.g., saloon, estate, MPV, executive) as the vehicle type selected during the booking process. All vehicles used by our suppliers are licensed, insured, and regularly maintained.',
        },
      ],
    },
    {
      heading: '11. Luggage',
      blocks: [
        {
          type: 'p',
          text: "Each vehicle category has a maximum luggage capacity. It is the **customer's responsibility** to ensure that the vehicle booked is suitable for the amount of luggage being carried.",
        },
        {
          type: 'p',
          text: 'If the luggage exceeds the capacity of the booked vehicle, the supplier may be unable to transport all items, and AeroTAXI shall not be liable in such cases. Customers are responsible for the loading and unloading of their own luggage, and for any personal belongings left in the vehicle after the journey.',
        },
      ],
    },
    {
      heading: '12. Force Majeure',
      blocks: [
        {
          type: 'p',
          text: 'Neither AeroTAXI nor its suppliers shall be held liable for any failure or delay in performing obligations under these Terms of Service where such failure or delay results from a Force Majeure event. In the event of a Force Majeure situation, AeroTAXI will make reasonable efforts to notify the customer as soon as practicable and, where possible, offer an alternative arrangement or a credit for future use.',
        },
      ],
    },
    {
      heading: '13. Complaints',
      blocks: [
        {
          type: 'p',
          text: `If you are dissatisfied with any aspect of your service, we encourage you to contact us as soon as possible so we can attempt to resolve the issue. Complaints should be submitted in writing to ${MAIL}.`,
        },
        {
          type: 'p',
          text: 'We will acknowledge all complaints within **5 working days** and aim to provide a full response within 14 working days. If the complaint involves the supplier directly, we will liaise with them on your behalf to seek a satisfactory resolution.',
        },
      ],
    },
    {
      heading: '14. Data Protection',
      blocks: [
        {
          type: 'p',
          text: 'AeroTAXI is committed to protecting your personal data in accordance with the **General Data Protection Regulation (GDPR)** and other applicable data protection laws.',
        },
        {
          type: 'p',
          text: `We collect and process personal data only as necessary to provide our services, fulfil bookings, and communicate with you. For full details on how we collect, use, store, and protect your personal data, please refer to our [Privacy Policy](${ROUTES.privacyPolicy}).`,
        },
      ],
    },
    {
      heading: '15. Governing Law and Jurisdiction',
      blocks: [
        {
          type: 'p',
          text: 'These Terms of Service shall be governed by and construed in accordance with the laws of the **State of Delaware, United States**.',
        },
        {
          type: 'p',
          text: 'In the event of any dispute arising out of or in connection with these terms, the parties agree to first attempt to resolve the matter through good-faith **mediation**. If mediation is unsuccessful, the dispute shall be referred to binding **arbitration** in accordance with the rules of the American Arbitration Association (AAA), with the seat of arbitration in Dover, Delaware. Nothing in this clause shall prevent either party from seeking injunctive relief or other equitable remedies from a court of competent jurisdiction.',
        },
      ],
    },
    {
      heading: '16. General',
      blocks: [
        {
          type: 'p',
          text: 'AeroTAXI reserves the right to update or modify these Terms of Service at any time without prior notice. Any changes will be effective immediately upon being posted on our website. It is your responsibility to review these terms periodically for any updates.',
        },
        {
          type: 'p',
          text: 'This website and its content are provided on an **"as-is"** and **"as available"** basis. While we strive to ensure the accuracy of information on our website, AeroTAXI makes no warranties or representations, express or implied, regarding the completeness, accuracy, or reliability of any information on the site.',
        },
        {
          type: 'p',
          text: 'If any provision of these Terms of Service is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.',
        },
        {
          type: 'p',
          text: 'These Terms of Service, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and AeroTAXI in relation to your use of this website and our services.',
        },
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  slug: 'privacy-policy',
  title: 'Privacy Policy',
  path: ROUTES.privacyPolicy,
  meta: 'Effective Date: January 1, 2025',
  intro: [
    `AeroTAXI LLC ("AeroTAXI", "we", "us", or "our") is a limited liability company registered in the State of Delaware, United States, with File Number **10104688**. Our registered address is ${SITE.address.inline}.`,
    'This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit our website and use our services. By using our website and services, you agree to the collection and use of information in accordance with this policy.',
  ],
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        { type: 'h3', text: '1.1 Information You Provide Voluntarily' },
        {
          type: 'p',
          text: 'When you make a booking, contact us, or interact with our services, we may collect the following information:',
        },
        {
          type: 'ul',
          items: [
            'Full name',
            'Email address',
            'Phone number',
            'Pickup and drop-off addresses',
            'Flight details (flight number, arrival time)',
            'Payment information (processed securely via Stripe; we do not store full card details)',
            'Special requests (e.g., child seats, accessibility needs)',
            'Any other information you voluntarily provide through our contact forms or customer support channels',
          ],
        },
        { type: 'h3', text: '1.2 Information Collected Automatically' },
        {
          type: 'p',
          text: 'When you visit our website, we may automatically collect certain technical information, including:',
        },
        {
          type: 'ul',
          items: [
            'IP address',
            'Browser type and version',
            'Operating system',
            'Referring website',
            'Pages visited and time spent on each page',
            'Device type (desktop, mobile, tablet)',
            `Cookies and similar tracking technologies (see our [Cookie Policy](${ROUTES.cookiePolicy}) for more details)`,
          ],
        },
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        { type: 'p', text: 'We use the information we collect for the following purposes:' },
        {
          type: 'ul',
          items: [
            'To process and manage your bookings',
            'To communicate with you regarding your booking (confirmations, updates, reminders)',
            'To provide customer support and respond to enquiries',
            'To process payments securely',
            'To improve our website, services, and user experience',
            'To comply with legal and regulatory obligations',
            'To detect and prevent fraud or other illegal activities',
            'To send you marketing communications (only with your explicit consent, and you can opt out at any time)',
          ],
        },
      ],
    },
    {
      heading: '3. How We Share Your Information',
      blocks: [
        {
          type: 'p',
          text: 'We **do not sell** your personal data. We may share your information with the following third parties only as necessary to provide our services:',
        },
        {
          type: 'ul',
          items: [
            '**Transport Suppliers:** We share relevant booking details (name, pickup/drop-off locations, flight information, contact number) with the licensed transport supplier fulfilling your journey.',
            '**Payment Processors:** Payment data is shared with Stripe for secure transaction processing.',
            '**Customer Support Tools:** We may use third-party platforms (e.g., Tawk.to) to manage customer communications.',
            '**Analytics Providers:** We do not currently use a third-party analytics service. If we introduce one, we will update this policy before it is enabled.',
            '**Legal Requirements:** We may disclose your information if required to do so by law, regulation, legal process, or governmental request.',
          ],
        },
      ],
    },
    {
      heading: '4. Data Protection and Security',
      blocks: [
        {
          type: 'p',
          text: 'We take the security of your personal data seriously and implement appropriate technical and organisational measures to protect it against unauthorised access, alteration, disclosure, or destruction. These measures include encrypted data transmission (SSL/TLS), secure server infrastructure, access controls, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
        },
      ],
    },
    {
      heading: '5. Your Rights',
      blocks: [
        { type: 'h3', text: '5.1 Rights Under GDPR (for EU/UK Residents)' },
        {
          type: 'p',
          text: 'If you are a resident of the European Union or United Kingdom, you have the following rights under the General Data Protection Regulation (GDPR):',
        },
        {
          type: 'ul',
          items: [
            '**Right of Access:** You can request a copy of the personal data we hold about you.',
            '**Right to Rectification:** You can request that we correct any inaccurate or incomplete data.',
            '**Right to Erasure:** You can request the deletion of your personal data (subject to legal obligations).',
            '**Right to Restrict Processing:** You can request that we limit the processing of your data.',
            '**Right to Data Portability:** You can request your data in a structured, machine-readable format.',
            '**Right to Object:** You can object to the processing of your data for certain purposes, including direct marketing.',
          ],
        },
        { type: 'h3', text: '5.2 Rights Under CCPA (for California Residents)' },
        {
          type: 'p',
          text: 'If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):',
        },
        {
          type: 'ul',
          items: [
            'The right to know what personal information we collect, use, and disclose.',
            'The right to request deletion of your personal information.',
            'The right to opt out of the sale of your personal information (we do not sell your data).',
            'The right to non-discrimination for exercising your privacy rights.',
          ],
        },
        {
          type: 'p',
          text: `To exercise any of these rights, please contact us at ${MAIL}. We will respond to your request within **30 days**.`,
        },
      ],
    },
    {
      heading: '6. Cookies',
      blocks: [
        {
          type: 'p',
          text: `Our website uses cookies and similar technologies to enhance your browsing experience, analyse site traffic, and personalise content. For detailed information about the cookies we use and how to manage your cookie preferences, please refer to our [Cookie Policy](${ROUTES.cookiePolicy}).`,
        },
      ],
    },
    {
      heading: '7. International Data Transfers',
      blocks: [
        {
          type: 'p',
          text: 'Your personal data may be transferred to and processed in countries outside your country of residence, including the United States, where our company is registered. Where such transfers occur, we ensure that appropriate safeguards are in place to protect your data in accordance with applicable data protection laws, including the use of Standard Contractual Clauses (SCCs) or other approved transfer mechanisms.',
        },
      ],
    },
    {
      heading: "8. Children's Privacy",
      blocks: [
        {
          type: 'p',
          text: `Our services are not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that we have inadvertently collected personal data from a child under 18, we will take steps to delete such information as soon as possible. If you believe that a child has provided us with their personal data, please contact us at ${MAIL}.`,
        },
      ],
    },
    {
      heading: '9. Contact Us',
      blocks: [
        {
          type: 'p',
          text: 'If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:',
        },
        {
          type: 'ul',
          items: [`**Email:** ${MAIL}`, `**Address:** ${SITE.address.inline}`],
        },
      ],
    },
  ],
};

export const PRIVACY_STATEMENT: LegalDocument = {
  slug: 'privacy-statement',
  title: 'Privacy Statement',
  path: ROUTES.privacyStatement,
  intro: [
    `This Privacy Statement provides a concise overview of how AeroTAXI LLC ("AeroTAXI", "we", "us", or "our") handles your personal data when you use our website and services. For a comprehensive description of our data practices, please refer to our full [Privacy Policy](${ROUTES.privacyPolicy}).`,
  ],
  sections: [
    {
      heading: 'Data Collection',
      blocks: [
        {
          type: 'p',
          text: 'We collect personal data that you provide directly to us when making a booking, contacting our support team, or using our website. This includes your name, email address, phone number, travel details, and payment information.',
        },
        {
          type: 'p',
          text: 'We also collect certain technical data automatically when you visit our website, such as your IP address, browser type, device information, and browsing behaviour through the use of cookies and similar technologies.',
        },
      ],
    },
    {
      heading: 'Data Usage',
      blocks: [
        { type: 'p', text: 'We use your personal data to:' },
        {
          type: 'ul',
          items: [
            'Process and manage your transport bookings',
            'Send booking confirmations, updates, and reminders',
            'Provide customer support and respond to your enquiries',
            'Process payments securely through our payment provider (Stripe)',
            'Improve our website and services',
            'Comply with legal and regulatory requirements',
          ],
        },
      ],
    },
    {
      heading: 'Data Sharing',
      blocks: [
        {
          type: 'p',
          text: 'We share your personal data only with trusted third parties who help us deliver our services:',
        },
        {
          type: 'ul',
          items: [
            '**Transport Suppliers:** Licensed operators who fulfil your journey receive necessary booking details.',
            '**Stripe:** Our payment processor handles all transaction data securely.',
            '**Tawk.to:** We use Tawk.to for live chat and customer support communications. Tawk.to may process your name, email, and conversation history to provide support services.',
            '**Analytics Providers:** We do not currently share your data with a third-party analytics service.',
            '**Legal Authorities:** We may disclose data when required by law or to protect our legal rights.',
          ],
        },
      ],
    },
    {
      heading: 'Security and Data Retention',
      blocks: [
        {
          type: 'p',
          text: 'We implement appropriate technical and organisational security measures to protect your personal data, including SSL/TLS encryption for data in transit, secure server infrastructure, and strict access controls.',
        },
        {
          type: 'p',
          text: 'We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by applicable laws and regulations. Booking data is typically retained for a period of up to **6 years** for accounting and legal compliance purposes. You may request deletion of your data at any time, subject to our legal obligations.',
        },
      ],
    },
    {
      heading: 'International Data Transfers',
      blocks: [
        {
          type: 'p',
          text: 'As AeroTAXI is registered in the United States, your data may be transferred to and processed in the US or other countries where our service providers operate. When transferring data internationally, we ensure that appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs), to protect your data in compliance with applicable data protection laws including the GDPR.',
        },
      ],
    },
    {
      heading: 'Your Rights',
      blocks: [
        {
          type: 'p',
          text: 'Depending on your location, you may have the following rights regarding your personal data:',
        },
        {
          type: 'ul',
          items: [
            'Access the personal data we hold about you',
            'Request correction of inaccurate or incomplete data',
            'Request deletion of your personal data',
            'Restrict or object to the processing of your data',
            'Request data portability',
            'Withdraw consent where processing is based on consent',
          ],
        },
        {
          type: 'p',
          text: `To exercise any of these rights, or if you have any questions about this Privacy Statement, please contact us at ${MAIL}.`,
        },
      ],
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  slug: 'cookie-policy',
  title: 'Cookie Policy',
  path: ROUTES.cookiePolicy,
  meta: 'Effective Date: 21-Apr-2025',
  sections: [
    {
      heading: 'What Are Cookies?',
      blocks: [
        {
          type: 'p',
          text: 'Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and supply information to the website owners. Cookies can be **"persistent"** (remaining on your device until they expire or you delete them) or **"session"** cookies (deleted when you close your browser).',
        },
      ],
    },
    {
      heading: 'How We Use Cookies',
      blocks: [
        {
          type: 'p',
          text: 'AeroTAXI uses cookies and similar tracking technologies to enhance your browsing experience, analyse website traffic, understand user preferences, and deliver relevant content. We use both first-party cookies (set by our website) and third-party cookies (set by our partners and service providers).',
        },
      ],
    },
    {
      heading: 'Types of Cookies We Use',
      blocks: [
        { type: 'h3', text: 'Essential Cookies' },
        {
          type: 'p',
          text: 'These cookies are strictly necessary for the website to function properly. They enable core functionality such as page navigation, secure areas access, and booking form submissions. Without these cookies, the website cannot operate correctly. Essential cookies do not require your consent.',
        },
        { type: 'h3', text: 'Functional Cookies' },
        {
          type: 'p',
          text: 'Functional cookies allow the website to remember choices you have made (such as your preferred language, region, or previously entered form data) and provide enhanced, personalised features. These cookies may also be used to remember changes you have made to text size, font, and other customisable parts of the website.',
        },
        { type: 'h3', text: 'Performance / Analytics Cookies' },
        {
          type: 'p',
          text: 'Analytics cookies collect information about how visitors use a website, such as which pages are visited most often, how long users spend on each page, and whether they encounter any errors. Any information collected this way is aggregated and anonymous. **We do not currently set analytics cookies.** If we introduce an analytics provider, we will name it here before it is enabled.',
        },
        { type: 'h3', text: 'Targeting / Advertising Cookies' },
        {
          type: 'p',
          text: 'Targeting cookies may be set through our website by advertising partners. They may be used to build a profile of your interests and show you relevant advertisements on other websites. These cookies do not directly store personal information but are based on uniquely identifying your browser and device. If you do not allow these cookies, you will experience less targeted advertising.',
        },
        { type: 'h3', text: 'Support Cookies' },
        {
          type: 'p',
          text: 'We use third-party support tools to provide live chat and customer assistance. These tools may set their own cookies to enable the chat functionality, remember your conversation history, and improve the support experience.',
        },
      ],
    },
    {
      heading: 'Live Chat (Tawk.to) Cookies',
      blocks: [
        {
          type: 'p',
          text: 'We use Tawk.to to provide live chat support on our website. Tawk.to sets its own cookies to enable the chat widget, keep your conversation history, and provide a seamless support experience across sessions. These cookies may include:',
        },
        {
          type: 'ul',
          items: [
            '**tawk_uuid_propertyId:** A visitor identifier that lets the chat recognise you across sessions. Essential; expires after six months.',
            '**twk_idm_key:** Manages your connection to the chat widget. Essential; lasts for the session only.',
            '**TawkConnectionTime:** Measures the connection time and keeps the widget working when our site is open in more than one tab. Lasts for the session only.',
            'Tawk.to also keeps a **twk_token** entry in your browser local storage so your chat history is still available when you return.',
          ],
        },
        {
          type: 'p',
          text: "For more information about how Tawk.to handles data, please visit [Tawk.to's Privacy Policy](https://www.tawk.to/privacy-policy/).",
        },
      ],
    },
    {
      heading: 'Managing Your Cookie Preferences',
      blocks: [
        { type: 'p', text: 'You can control and manage cookies in several ways:' },
        {
          type: 'ul',
          items: [
            "**Browser Settings:** Most web browsers allow you to manage cookies through their settings. You can typically set your browser to block or delete cookies, or to alert you when a cookie is being set. Please refer to your browser's help section for instructions on how to manage cookies.",
            '**Opt-Out Links:** Where a third-party service we use offers its own opt-out mechanism, we will link it here. The Tawk.to chat cookies described above can be removed through your browser settings.',
          ],
        },
        {
          type: 'p',
          text: 'Please note that disabling or deleting cookies may affect the functionality of our website. Some features may not work as intended if cookies are disabled.',
        },
      ],
    },
    {
      heading: 'Contact Us',
      blocks: [
        {
          type: 'p',
          text: `If you have any questions about our use of cookies, please contact us at ${MAIL}.`,
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  PRIVACY_STATEMENT,
  COOKIE_POLICY,
] as const;
