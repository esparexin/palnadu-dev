#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const defaultBrainDir = path.resolve(
  process.env.HOME || '/Users/admin',
  '.gemini/antigravity/brain'
);

function parseIso(ts) {
  if (!ts) return null;
  try {
    return new Date(ts);
  } catch {
    return null;
  }
}

function analyzeTranscript(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const steps = [];
  for (const line of lines) {
    if (line.trim()) {
      try {
        steps.push(jsonParse(line));
      } catch {}
    }
  }
  return steps;
}

function jsonParse(str) {
  return JSON.parse(str);
}

function runAudit() {
  const targetCid = process.argv[2];
  let sessionDirs = [];

  if (!fs.existsSync(defaultBrainDir)) {
    console.log(`ℹ️ Antigravity brain directory not found at ${defaultBrainDir}`);
    return;
  }

  try {
    sessionDirs = fs.readdirSync(defaultBrainDir).filter((d) => {
      const p = path.join(defaultBrainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
      return fs.existsSync(p);
    });
  } catch {
    console.log('ℹ️ Running in restricted sandbox. Brain directory inspection skipped.');
    return;
  }

  if (targetCid) {
    sessionDirs = sessionDirs.filter((d) => d.startsWith(targetCid));
  } else {
    // Sort by recent
    sessionDirs.sort((a, b) => {
      const ta = fs.statSync(path.join(defaultBrainDir, a)).mtimeMs;
      const tb = fs.statSync(path.join(defaultBrainDir, b)).mtimeMs;
      return tb - ta;
    });
    sessionDirs = sessionDirs.slice(0, 5);
  }

  console.log(`📊 Antigravity Execution Efficiency Audit (${sessionDirs.length} sessions analyzed):\n`);
  console.log('='.repeat(80));

  for (const cid of sessionDirs) {
    const tpath = path.join(defaultBrainDir, cid, '.system_generated', 'logs', 'transcript.jsonl');
    let steps = [];
    try {
      steps = analyzeTranscript(tpath);
    } catch {
      continue;
    }
    if (steps.length === 0) continue;

    const tStart = parseIso(steps[0].created_at);
    const tEnd = parseIso(steps[steps.length - 1].created_at);
    const totalSec = tStart && tEnd ? (tEnd - tStart) / 1000 : 0;

    let commands = 0;
    let reads = 0;
    let edits = 0;
    let compactions = 0;
    let apiErrors = 0;
    const cmdFreq = {};
    const readFreq = {};

    for (const s of steps) {
      if (s.type === 'CHECKPOINT') compactions++;
      if (s.type === 'ERROR_MESSAGE') apiErrors++;
      if (s.type === 'PLANNER_RESPONSE' && Array.isArray(s.tool_calls)) {
        for (const tc of s.tool_calls) {
          const name = tc.name;
          const args = tc.args || tc.arguments || {};
          if (name === 'run_command') {
            commands++;
            const cmd = String(args.CommandLine || '').trim().split(' ')[0];
            cmdFreq[cmd] = (cmdFreq[cmd] || 0) + 1;
          } else if (name === 'read_file') {
            reads++;
            const p = String(args.Path || '');
            readFreq[p] = (readFreq[p] || 0) + 1;
          } else if (name === 'edit_file' || name === 'write_file') {
            edits++;
          }
        }
      }
    }

    const durMin = (totalSec / 60).toFixed(1);
    const durHrs = (totalSec / 3600).toFixed(2);
    console.log(`Session: ${cid.slice(0, 12)}... | Steps: ${steps.length} | Duration: ${durHrs}h (${durMin}m)`);
    console.log(`  Actions: Commands=${commands}, Reads=${reads}, Edits=${edits}`);
    console.log(`  Overhead: Compactions=${compactions}, API/Stream Errors=${apiErrors}`);

    const dupReads = Object.entries(readFreq).filter(([, c]) => c > 3);
    if (dupReads.length > 0) {
      console.log(`  ⚠️ Repeated Reads (>3x): ${dupReads.map(([p, c]) => `${path.basename(p)} (${c}x)`).join(', ')}`);
    }

    const heavyCmds = Object.entries(cmdFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (heavyCmds.length > 0) {
      console.log(`  Top Commands: ${heavyCmds.map(([c, n]) => `${c} (${n}x)`).join(', ')}`);
    }
    console.log('-'.repeat(80));
  }
}

runAudit();
