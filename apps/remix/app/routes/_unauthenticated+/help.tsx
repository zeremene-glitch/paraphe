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
    title: 'Try the sample document',
    body: 'New accounts start with "Sample - try signing me.pdf". Open it, press Start and sign it. It takes a minute and nobody else receives it.',
  },
  {
    title: 'Choose what you want to do',
    body: 'The Documents page starts with three choices: Just me, Send for signature and Use a template. Click one to choose a file, or drop the file on it. PDF and Word (.docx) both work; Word files become PDF.',
  },
  {
    title: 'Just me: sign your own file',
    body: 'Pick Just me and choose the file. Scriptia adds your signature, name and date at the end of the document and opens it for you to sign.',
    points: [
      'Press Start: it takes you to each field in turn.',
      'Press Complete. The signed PDF is ready to download a few seconds later, and you also get it by email.',
    ],
  },
  {
    title: 'Send for signature: add the people',
    body: 'Pick Send for signature and choose the file. Then type the email and name of each person who signs. Scriptia suggests people you have sent to before.',
    points: [
      'Add Myself puts you on the list if you sign too.',
      'Use the pen icon next to a person to change their role: Signer, Approver, Viewer, Assistant or CC (gets a copy only).',
      'People need to sign one after the other? Click More options and turn on Enable signing order.',
      'Signers do not need a Scriptia account.',
    ],
  },
  {
    title: 'Check where they sign (optional)',
    body: 'Each signer gets a signature, name and date at the end of the document automatically. Click Check where they sign to see them, drag them somewhere else, or add more fields such as Text or Checkbox.',
    points: [
      'Tip: write tags such as {{signature, r1}} in your Word file and the fields land exactly there. See "How do I place fields automatically?" below.',
    ],
  },
  {
    title: 'Send',
    body: 'Click Send, add a message if you like, and click Send again. Each person receives an email with their own link.',
    points: [
      'If someone has no signature field yet, click Add them for me.',
      'Change subject or reply-to address is under the message box.',
      'Reminders go out automatically to anyone who has not signed yet.',
    ],
  },
  {
    title: 'Follow progress',
    body: 'Use the tabs on the Documents page: To sign (waiting for you), Waiting for others, Completed, Drafts and All. Open a document to see who has opened or signed it.',
    points: ['Resend sends the email again to someone who lost it.'],
  },
  {
    title: 'Download the signed PDF',
    body: 'When everyone has signed, the document moves to Completed and everyone receives the final PDF by email. You can also click Download on the document.',
    points: [
      'The PDF is sealed and time-stamped. Any change after signing breaks the seal.',
      'The last page is the Certificate of Completion: signers, times, IP addresses and the document fingerprint (SHA-256).',
    ],
  },
  {
    title: 'Reuse a document as a template',
    body: 'For documents you send often, go to Templates, upload the file and set up placeholders (Recipient 1, Recipient 2…) and their fields once. Next time, choose Use a template on the Documents page.',
    points: [
      'Click Use, fill in the real names and emails, and a new document is created, ready to send.',
      'Bulk Send via CSV creates one document per row of a spreadsheet, up to 100 rows.',
      'Create Direct Link gives a link (or QR code) anyone can open to sign straight away.',
    ],
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
      'Yes. Add each person under Send for signature. Each one gets their own fields automatically. When the last person signs, everyone receives one PDF with all the signatures.',
  },
  {
    group: 'Sending',
    question: 'Can people sign in a fixed order?',
    answer:
      'Yes. Under the list of people, click More options, turn on Enable signing order and drag the people into the order you want. The next person is invited only when the one before has signed.',
  },
  {
    group: 'Sending',
    question: 'I only need to sign something myself. What is the fastest way?',
    answer:
      'Choose Just me on the Documents page and pick the file. Scriptia places your signature, name and date and opens the document for you. Press Start, sign, then Complete. Nothing is emailed to anyone else.',
  },
  {
    group: 'Sending',
    question: 'Do I have to place the fields myself?',
    answer:
      'No. Every signer gets a signature, name and date at the bottom of the last page. Open Add Fields (or Check where they sign) only if you want to move them or add more.',
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
      'Click the button in the email and read the document. Press Start: it takes you to each field you need to fill. Then click Complete. You will receive the signed PDF by email when everyone has signed.',
  },
  {
    group: 'Signing',
    question: 'Can several people sign on the same tablet?',
    answer:
      'Yes. Send the document, then open it on the tablet and click Sign on this device. Each person taps their name, signs, and the tablet returns to the list for the next person. People who are not there can still sign later from their email.',
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
      'Yes. In the document editor, click the gear icon at the top (Document Settings) and set Document access to "Require verification code". The signer must enter a 6-digit code sent by email before opening the document.',
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
