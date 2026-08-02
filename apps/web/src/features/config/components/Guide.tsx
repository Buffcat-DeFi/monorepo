'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  Table2,
  Upload,
  ScanSearch,
  FilterX,
  BarChart3,
  Waves,
  TriangleAlert,
  Plus,
  Coins,
  ExternalLink,
  ShieldCheck,
  BookMarked,
} from 'lucide-react';

interface GuideProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── colour tokens per section ──────────────────────────────────────────── */
const PALETTE = {
  violet: {
    node: 'from-violet-500 to-purple-600',
    nodeBorder: 'border-violet-400/50',
    nodeBg: 'bg-violet-500/10',
    line: 'bg-gradient-to-b from-violet-500/40 to-violet-500/10',
    sectionNum: 'text-violet-600',
    code: 'text-violet-600',
  },
  cyan: {
    node: 'from-cyan-400 to-blue-500',
    nodeBorder: 'border-cyan-400/50',
    nodeBg: 'bg-cyan-500/10',
    line: 'bg-gradient-to-b from-cyan-500/40 to-cyan-500/10',
    sectionNum: 'text-cyan-600',
    code: 'text-cyan-600',
  },
  emerald: {
    node: 'from-emerald-400 to-green-600',
    nodeBorder: 'border-emerald-400/50',
    nodeBg: 'bg-emerald-500/10',
    line: 'bg-gradient-to-b from-emerald-500/40 to-emerald-500/10',
    sectionNum: 'text-emerald-600',
    code: 'text-emerald-600',
  },
} as const;

type PaletteKey = keyof typeof PALETTE;

/* ─── tag variants ────────────────────────────────────────────────────────── */
const TAG_STYLES = {
  onchain:
    'bg-violet-500/15 text-violet-500 border-violet-500/35 shadow-[0_0_6px_rgba(139,92,246,0.25)]',
  filter:
    'bg-sky-500/15 text-sky-500 border-sky-500/35 shadow-[0_0_6px_rgba(14,165,233,0.20)]',
  exclude:
    'bg-rose-500/15 text-rose-500 border-rose-500/35 shadow-[0_0_6px_rgba(244,63,94,0.20)]',
  action:
    'bg-emerald-500/15 text-emerald-500 border-emerald-500/35 shadow-[0_0_6px_rgba(52,211,153,0.20)]',
  warning:
    'bg-amber-500/15 text-amber-500 border-amber-500/35 shadow-[0_0_6px_rgba(251,191,36,0.20)]',
};

/* ─── SectionHeader ───────────────────────────────────────────────────────── */
function SectionHeader({
  index,
  title,
  description,
  palette,
}: {
  index: string;
  title: string;
  description?: string;
  palette: PaletteKey;
}) {
  const p = PALETTE[palette];
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`font-black text-sm tracking-[0.2em] tabular-nums ${p.sectionNum}`}>
          {index}
        </span>
        <div className={`h-px flex-1 bg-gradient-to-r ${p.node} opacity-30`} />
        <span className="font-bold text-xs tracking-widest uppercase text-custom-primary-text">
          {title}
        </span>
      </div>
      {description && (
        <p className="text-xs text-custom-muted-text leading-relaxed">{description}</p>
      )}
    </div>
  );
}

/* ─── SubSectionHeader ────────────────────────────────────────────────────── */
function SubSectionHeader({
  label,
  tag,
  icon: Icon,
  gradient,
  accentBorder,
}: {
  label: string;
  tag?: string;
  icon?: React.ElementType;
  gradient: string;
  accentBorder: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 border-l-4 ${accentBorder} bg-white/[0.06] border border-white/10`}
    >
      {Icon && (
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} shadow-md shrink-0`}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm font-black tracking-[0.12em] uppercase text-custom-primary-text">
          {label}
        </span>
        {tag && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-widest uppercase bg-gradient-to-r ${gradient} bg-opacity-20 text-white/70`}
          >
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── TimelineItem ────────────────────────────────────────────────────────── */
interface TimelineItemProps {
  code: string;
  tag?: string;
  tagVariant?: keyof typeof TAG_STYLES;
  title: string;
  description: string;
  icon: React.ElementType;
  isLast?: boolean;
  links?: { label: string; url: string }[];
  palette: PaletteKey;
}

function TimelineItem({
  code,
  tag,
  tagVariant,
  title,
  description,
  icon: Icon,
  isLast,
  links,
  palette,
}: TimelineItemProps) {
  const p = PALETTE[palette];

  return (
    <div className="relative flex gap-4">
      {/* Node + line column */}
      <div className="flex flex-col items-center shrink-0 w-7">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${p.node} border ${p.nodeBorder} shadow-md z-10 shrink-0`}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        {!isLast && <div className={`w-px flex-1 min-h-[20px] mt-1 ${p.line}`} />}
      </div>

      {/* Content — no bottom padding; spacing handled by parent gap */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`text-[11px] font-black border rounded-md px-1.5 py-0.5 tracking-widest ${p.code}`}
          >
            {code}
          </span>
          {tag && tagVariant && (
            <span
              className={`text-[10px] font-bold border rounded-md px-1.5 py-0.5 tracking-widest uppercase ${TAG_STYLES[tagVariant]}`}
            >
              {tag}
            </span>
          )}
        </div>

        <p className="font-bold text-sm text-custom-primary-text leading-snug mb-1">{title}</p>
        <p className="text-xs text-custom-muted-text leading-relaxed">{description}</p>

        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
            {links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-custom-primary-color hover:text-custom-primary-color/70 hover:underline underline-offset-2 transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section separator ───────────────────────────────────────────────────── */
function SectionDivider({ from, to }: { from: string; to: string }) {
  return <div className={`h-px bg-gradient-to-r ${from} via-white/10 ${to}`} />;
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Guide({ isOpen, onClose }: GuideProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-2 border-custom-primary-color bg-custom-bg custom-box-shadow rounded-2xl p-0 gap-0 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="relative px-5 pt-5 pb-4 border-b border-custom-primary-color/20 shrink-0 overflow-hidden">
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl crypto-orange-gradient-bg shrink-0">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="font-bold text-base leading-tight text-custom-primary-text">
                Token Whitelisting Guide
              </DialogTitle>
              <p className="text-xs font-normal text-custom-muted-text leading-tight mt-0.5">
                A step-by-step walkthrough to configure tokens in Buffcat
              </p>
            </div>
          </div>
        </div>

        {/* ── Scrollable timeline ──────────────────────────────────────── */}
        <ScrollArea className="h-[540px] bg-transparent">
          {/*
            Single source of truth for spacing: every direct child of this
            flex column gets exactly 20px (gap-5) between it and its sibling.
            No mt/mb/pb on SectionHeader, SubSectionHeader, TimelineItem, or
            SectionDivider — the gap handles all of it uniformly.
          */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* ══ SECTION 01 — WHITELIST TOKENS ═══════════════════════ */}
            <SectionHeader
              index="01"
              title="Whitelist Tokens"
              palette="violet"
              description="Register token addresses in the Buffcat contract first — nothing else works until a token is whitelisted."
            />
            <TimelineItem
              code="1A"
              palette="violet"
              icon={Download}
              title="Download the template"
              description="Grab the CSV template from the Whitelist panel using the Template CSV button."
            />
            <TimelineItem
              code="1B"
              palette="violet"
              icon={Table2}
              title="Fill it in with Excel"
              description="One token address per row in the Token Address column, matching the template header exactly."
            />
            <TimelineItem
              code="1C"
              palette="violet"
              icon={Upload}
              title="Upload the CSV"
              description='Drop the file into "Upload CSV to Whitelist" inside the Add Tokens card.'
            />
            <TimelineItem
              code="1D"
              palette="violet"
              tag="ON-CHAIN"
              tagVariant="onchain"
              icon={ShieldCheck}
              title="Whitelisted in the Buffcat contract"
              description='Click "Whitelist Tokens," approve the transaction in your wallet, and wait for on-chain confirmation.'
              isLast
            />

            <SectionDivider from="from-violet-500/20" to="to-cyan-500/20" />

            {/* ══ SECTION 02 — WIRE A PRICE SOURCE ════════════════════ */}
            <SectionHeader
              index="02"
              title="Wire a Price Source"
              palette="cyan"
              description="Every whitelisted token needs a USD price before it can earn rewards. Try Chainlink first — fall back to Uniswap V3."
            />
            <SubSectionHeader
              icon={BarChart3}
              label="Chainlink Feed"
              tag="Preferred"
              gradient="from-sky-400 to-blue-600"
              accentBorder="border-sky-500"
            />
            <TimelineItem
              code="2A"
              palette="cyan"
              tag="FILTER"
              tagVariant="filter"
              icon={ScanSearch}
              title="Mainnet + Crypto"
              description='Set Network to Mainnet and Asset Type to "Crypto" so invalid feeds drop out. You need feeds labelled "Token / USD" only.'
              links={[
                { label: 'Chainlink Feeds (Ethereum)', url: 'https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum#ethereum-mainnet' },
                { label: 'Chainlink Feeds (Base)', url: 'https://docs.chain.link/data-feeds/price-feeds/addresses?network=base#ethereum-mainnet' },
              ]}
            />
            <TimelineItem
              code="2B"
              palette="cyan"
              tag="EXCLUDE"
              tagVariant="exclude"
              icon={FilterX}
              title="Avoid SVR Proxy feeds"
              description='Pick the plain "Token / USD" feed. Do NOT use anything labelled "SVR Proxy" or "AAVE SVR Proxy" — those are invalid for Buffcat.'
            />
            <TimelineItem
              code="2C"
              palette="cyan"
              tag="ADD FEEDS"
              tagVariant="action"
              icon={Plus}
              title="Submit via Data Feeds panel"
              description='Go to the Data Feeds panel, download the template, fill in Token Address and Chainlink Data Feed columns, upload, and click "Add Feeds."'
              isLast
            />
            <SubSectionHeader
              icon={Waves}
              label="Uniswap V3 Pool"
              tag="Fallback"
              gradient="from-pink-400 to-rose-600"
              accentBorder="border-pink-500"
            />
            <TimelineItem
              code="2D"
              palette="cyan"
              tag="FILTER"
              tagVariant="filter"
              icon={ScanSearch}
              title="V3 only · TVL ≥ $1 M"
              description="Filter by Protocol = V3 on Uniswap Explore. Only pools with at least $1 M TVL are safe — low-liquidity pools can be manipulated to drain rewards."
              links={[
                { label: 'Uniswap Pools (Ethereum)', url: 'https://app.uniswap.org/explore/pools/ethereum' },
                { label: 'Uniswap Pools (Base)', url: 'https://app.uniswap.org/explore/pools/base' },
              ]}
            />
            <TimelineItem
              code="2E"
              palette="cyan"
              tag="IMPORTANT"
              tagVariant="warning"
              icon={TriangleAlert}
              title="Paired token also needs a feed"
              description="The token your pool is paired with must itself have a valid Chainlink feed in the contract. USDC is pre-configured — all others must be added manually."
            />
            <TimelineItem
              code="2F"
              palette="cyan"
              tag="ADD POOLS"
              tagVariant="action"
              icon={Plus}
              title="Submit via Token Pools panel"
              description='Go to the Token Pools panel, download the template, fill in Token Address, Uniswap V3 Pool, and Paired Token columns, upload, and click "Add Pools."'
              isLast
            />

            <SectionDivider from="from-cyan-500/20" to="to-emerald-500/20" />

            {/* ══ SECTION 03 — STABLE COINS ════════════════════════════ */}
            <SectionHeader
              index="03"
              title="Mark Stable Coins (Optional)"
              palette="emerald"
              description="Tokens flagged as stable coins behave differently from volatile tokens when Buffcat distributes rewards."
            />
            <TimelineItem
              code="3A"
              palette="emerald"
              icon={Download}
              title="Download the stable coins template"
              description="Use the Template CSV button in the Stable Coins panel."
            />
            <TimelineItem
              code="3B"
              palette="emerald"
              icon={Table2}
              title="Fill in the token addresses"
              description="Same format as the whitelist — one address per row under the Token Address column."
            />
            <TimelineItem
              code="3C"
              palette="emerald"
              icon={Upload}
              title="Upload and submit"
              description='Upload the CSV in the Stable Coins panel, then click "Add Stable Coins."'
            />
            <TimelineItem
              code="3D"
              palette="emerald"
              tag="ON-CHAIN"
              tagVariant="onchain"
              icon={Coins}
              title="Registered as stable coin"
              description="Approve the transaction and wait for confirmation. The token will now behave as a stable coin in the Buffcat contract."
              isLast
            />

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
