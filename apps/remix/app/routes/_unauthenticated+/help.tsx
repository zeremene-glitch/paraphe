import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@documenso/ui/primitives/accordion';
import { Input } from '@documenso/ui/primitives/input';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { BrandingLogo } from '~/components/general/branding-logo';

export function meta() {
  return [{ title: 'Help - Scriptia' }];
}

type Step = {
  title: string;
  body: string;
  points?: string[];
};

const GETTING_STARTED: Step[] = [
  {
    title: 'Upload a document',
    body: 'On the Documents page, drop a PDF or Word (.docx) file on the upload area, or click it to choose a file. Word files are converted to PDF for you.',
    points: [
      'The first screen, General, lets you change the title, the language of the emails and who can see the document.',
      'Tip: write tags such as {{signature, r1}} in your Word file and Scriptia places the fields for you. See "How do I place fields automatically?" in the FAQ.',
    ],
  },
  {
    title: 'Add the signers',
    body: 'In Add Signers, enter the email and name of each person. Add as many as you need: everyone signs the same document.',
    points: [
      'Use the pen icon next to each person to choose their role: Signer, Approver, Viewer, Assistant or CC (receives a copy only).',
      'Turn on Enable signing order if people must sign one after the other.',
      'Signers do not need a Scriptia account.',
    ],
  },
  {
    title: 'Place the fields',
    body: 'In Add Fields, pick a signer at the top, then drag Signature, Name, Date, Text or other fields onto the page. Each signer has their own colour.',
    points: ['Every signer needs at least one Signature field.', 'Drag the corners of a field to resize it.'],
  },
  {
    title: 'Send',
    body: 'In Distribute Document, check the email subject and message, then click Send. Each signer receives an email with a personal link.',
    points: [
      'Reminders go out automatically to anyone who has not signed yet (see Settings → Reminders).',
      'To ask for an extra check before signing, set Document access to "Require verification code" in General.',
    ],
  },
  {
    title: 'Follow progress',
    body: 'The Documents page shows each document as Draft, Pending or Completed. Open a document to see who has opened, signed or not yet acted.',
    points: ['Use Resend to send the email again to someone who lost it.'],
  },
  {
    title: 'Download the signed PDF',
    body: 'When everyone has signed, the document becomes Completed and everyone receives the final PDF by email. You can also click Download on the document.',
    points: [
      'The PDF is sealed and time-stamped. A change after signing breaks the seal.',
      'The last page is the Certificate of Completion: signers, times, IP addresses and the document fingerprint (SHA-256).',
      'The full activity history stays in Scriptia (document page → Audit Logs).',
    ],
  },
  {
    title: 'Reuse a document as a template',
    body: 'For documents you send often, go to Templates, upload the file and set up placeholders (Recipient 1, Recipient 2…) and their fields once.',
    points: [
      'Click Use, fill in the real names and emails, and a new document is created, ready to send.',
      'Edit Template changes the template only. Documents already created are not affected.',
    ],
  },
  {
    title: 'Send to many people at once (CSV)',
    body: 'On a template, click Bulk Send via CSV. Download the CSV example, put one row per document, upload it and click Upload and Process.',
    points: [
      'Each row creates a separate document. Up to 100 rows per file.',
      'You get an email with a summary when it has finished.',
    ],
  },
  {
    title: 'Share a direct link',
    body: 'On a template, click Create Direct Link. Anyone who opens the link can fill in their details and sign straight away, without an email invitation.',
    points: ['Useful for a QR code on a sign-in sheet or a link on a website.'],
  },
  {
    title: 'Add your logo and colours',
    body: 'Go to Settings → Branding to upload your logo, choose a brand colour and add your company details. Signers see them on the signing page and in emails.',
  },
];

type Faq = {
  question: string;
  answer: string;
  group: 'Sending' | 'Signing' | 'Templates' | 'Legal and security';
};

const FAQS: Faq[] = [
  {
    group: 'Sending',
    question: 'Can several people sign the same document?',
    answer:
      'Yes. Add each person in Add Signers and give each one their own fields. When the last person signs, everyone receives one PDF with all the signatures.',
  },
  {
    group: 'Sending',
    question: 'Can people sign in a fixed order?',
    answer:
      'Yes. Turn on Enable signing order in Add Signers and drag the people into the order you want. The next person is invited only when the one before has signed.',
  },
  {
    group: 'Sending',
    question: 'Which files can I upload?',
    answer: 'PDF and Word (.docx). Word files are converted to PDF when you upload them.',
  },
  {
    group: 'Sending',
    question: 'How do I place fields automatically?',
    answer:
      'Type tags in your Word or PDF file where each field should go, for example {{signature, r1}}, {{name, r1}}, {{date, r1}} or {{text, r1}}. Use r1 for the first person, r2 for the second, and so on. When you upload the file, Scriptia creates the signers and the fields, makes each field fill its table cell, and removes the tags from the document.',
  },
  {
    group: 'Sending',
    question: 'Someone did not receive the email. What can I do?',
    answer:
      'Ask them to check their spam folder. Then open the document and click Resend. You can also copy their personal signing link from the document page and send it another way.',
  },
  {
    group: 'Sending',
    question: 'Are reminders sent automatically?',
    answer:
      'Yes. By default, people who have not signed get a reminder after a few days and then regularly until they sign. Change this in Settings → Reminders.',
  },
  {
    group: 'Sending',
    question: 'Can I cancel a document after sending it?',
    answer:
      'Yes, while it is still pending. Open the document menu and choose Cancel or Delete. Signers can no longer sign it.',
  },
  {
    group: 'Templates',
    question: 'What is the difference between Use and Bulk Send via CSV?',
    answer:
      'Use creates one document with all the template signers, for example an attendance sheet everyone signs. Bulk Send creates one separate document per CSV row, for example an individual agreement for each person.',
  },
  {
    group: 'Templates',
    question: 'Can I change a template without creating a draft?',
    answer:
      'Yes. Open the template and click Edit Template. Changes are saved to the template only. Nothing is added to Documents until you click Use.',
  },
  {
    group: 'Templates',
    question: 'Do changes to a template update documents I already sent?',
    answer: 'No. Every document is an independent copy made at the moment you used the template.',
  },
  {
    group: 'Signing',
    question: 'Do signers need an account?',
    answer: 'No. They open the link in the email, sign and finish. An account is only needed to send documents.',
  },
  {
    group: 'Signing',
    question: 'I received an email from Scriptia. What do I do?',
    answer:
      'Click the button in the email, read the document, fill in the highlighted fields and click Complete. You will receive the signed PDF by email when everyone has signed.',
  },
  {
    group: 'Signing',
    question: 'Can I sign on my phone?',
    answer: 'Yes. Scriptia works in any modern browser on phones, tablets and computers. Nothing to install.',
  },
  {
    group: 'Signing',
    question: 'What if I do not want to sign?',
    answer: 'Use Reject Document on the signing page and, if you wish, give a reason. The sender is notified.',
  },
  {
    group: 'Legal and security',
    question: 'Is an electronic signature legally valid?',
    answer:
      'Electronic signatures are recognised in most countries, including under eIDAS in the European Union and the E-SIGN Act in the United States, to the extent permitted by applicable law. Some documents may legally require a different form of signature, so check the rules for your case.',
  },
  {
    group: 'Legal and security',
    question: 'How can someone check that a signed PDF was not changed?',
    answer:
      'The PDF carries a digital seal and a trusted time-stamp. Opening it in Adobe Acrobat Reader shows the signature panel. Any change after signing breaks the seal. The Certificate of Completion also lists the fingerprint (SHA-256) of the original file.',
  },
  {
    group: 'Legal and security',
    question: 'What is on the Certificate of Completion?',
    answer:
      'Who signed, their email, when they opened and signed, their IP address and device, how they were verified, and the document fingerprint. It is the last page of the signed PDF.',
  },
  {
    group: 'Legal and security',
    question: 'Can I require extra verification before signing?',
    answer:
      'Yes. In General, set Document access to "Require verification code". The signer must enter a 6-digit code sent by email before opening the document.',
  },
  {
    group: 'Legal and security',
    question: 'Where is my data stored?',
    answer:
      'Documents are stored on servers in Frankfurt, Germany, over encrypted connections, with daily backups kept in a separate location.',
  },
];

const GROUPS: Faq['group'][] = ['Sending', 'Templates', 'Signing', 'Legal and security'];

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Show {{tags}} as inline code.
const withCode = (text: string) =>
  text.split(/(\{\{[^}]+\}\})/g).map((part, index) =>
    part.startsWith('{{') ? (
      <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
        {part}
      </code>
    ) : (
      part
    ),
  );

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return FAQS;
    }

    return FAQS.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="w-full max-w-5xl">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Scriptia home">
          <BrandingLogo className="h-7 w-auto" />
        </Link>

        <Link to="/" className="text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground">
          Back to Scriptia
        </Link>
      </header>

      <div className="mt-10 max-w-2xl">
        <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">Help</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          How to send documents for signature with Scriptia, and answers to common questions.
        </p>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[200px_1fr]">
        <nav aria-label="Help sections" className="hidden md:block">
          <ul className="sticky top-8 space-y-2 text-sm">
            <li>
              <a href="#getting-started" className="text-muted-foreground hover:text-foreground">
                Getting started
              </a>
            </li>
            <li>
              <a href="#faq" className="text-muted-foreground hover:text-foreground">
                FAQ
              </a>
              <ul className="mt-2 space-y-2 border-l pl-3">
                {GROUPS.map((group) => (
                  <li key={group}>
                    <a href={`#${slug(group)}`} className="text-muted-foreground hover:text-foreground">
                      {group}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <section id="getting-started" className="scroll-mt-8">
            <h2 className="font-semibold text-2xl tracking-tight">Getting started</h2>

            <ol className="mt-6 space-y-4">
              {GETTING_STARTED.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-lg border bg-background p-5">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-sm tabular-nums"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-medium leading-7">{step.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{withCode(step.body)}</p>

                    {step.points && (
                      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground text-sm leading-relaxed">
                        {step.points.map((point) => (
                          <li key={point}>{withCode(point)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="faq" className="mt-16 scroll-mt-8">
            <h2 className="font-semibold text-2xl tracking-tight">Frequently asked questions</h2>

            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the questions"
              aria-label="Search the questions"
              className="mt-6 bg-background"
            />

            {filteredFaqs.length === 0 && (
              <p className="mt-6 text-muted-foreground text-sm">No question matches "{search}".</p>
            )}

            {GROUPS.map((group) => {
              const faqs = filteredFaqs.filter((faq) => faq.group === group);

              if (faqs.length === 0) {
                return null;
              }

              return (
                <div key={group} id={slug(group)} className="mt-8 scroll-mt-8">
                  <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">{group}</h3>

                  <Accordion type="multiple" className="mt-2">
                    {faqs.map((faq) => (
                      <AccordionItem key={faq.question} value={faq.question}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {withCode(faq.answer)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </section>

          <p className="mt-16 text-muted-foreground text-sm">
            Questions about a document you received? Contact the person or company who sent it to you.
          </p>
        </div>
      </div>
    </div>
  );
}
