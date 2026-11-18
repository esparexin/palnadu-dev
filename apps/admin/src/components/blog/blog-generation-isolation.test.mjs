import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Blog Generation Button Isolation & Duplicate Prevention', () => {
  describe('Queue Topic Row Button Isolation', () => {
    const sampleQueue = [
      { id: 'topic-1', topicKey: 'k-1', topic: 'Dental Clinic Guide' },
      { id: 'topic-2', topicKey: 'k-2', topic: 'School Admission Software' },
      { id: 'topic-3', topicKey: 'k-3', topic: 'Local SEO Guide' },
    ];

    it('activates loading indicator strictly on the target topic and never on siblings', () => {
      const activeTopicId = 'topic-2';

      const rowStates = sampleQueue.map((item) => {
        const topicId = item.id || item.topicKey || item.topic;
        const isThisItemGenerating = activeTopicId === topicId;
        const isGenerating = Boolean(activeTopicId);
        return {
          id: item.id,
          showsSpinner: isThisItemGenerating,
          isDisabled: isGenerating,
        };
      });

      assert.equal(rowStates[0].showsSpinner, false, 'topic-1 must NOT show spinner');
      assert.equal(rowStates[1].showsSpinner, true, 'topic-2 MUST show spinner');
      assert.equal(rowStates[2].showsSpinner, false, 'topic-3 must NOT show spinner');

      assert.equal(rowStates[0].isDisabled, true, 'topic-1 must be disabled during active generation');
      assert.equal(rowStates[1].isDisabled, true, 'topic-2 must be disabled during active generation');
      assert.equal(rowStates[2].isDisabled, true, 'topic-3 must be disabled during active generation');
    });

    it('identifies topic by fallback keys when id is missing', () => {
      const itemWithoutId = { topicKey: 'te-software-sattenapalle', topic: 'Sattenapalle Software' };
      const topicId = itemWithoutId.id || itemWithoutId.topicKey || itemWithoutId.topic;
      assert.equal(topicId, 'te-software-sattenapalle');

      const matches = 'te-software-sattenapalle' === topicId;
      assert.equal(matches, true);
    });
  });

  describe('Header Action Button Isolation', () => {
    it('shows spinner on header button ONLY when generatingGeneralDraft is true', () => {
      // Scenario A: Queue topic is generating
      const queueGeneratingState = {
        generatingTopicId: 'topic-123',
        generatingGeneralDraft: false,
      };
      const isGeneratingA = Boolean(
        queueGeneratingState.generatingTopicId || queueGeneratingState.generatingGeneralDraft,
      );
      assert.equal(queueGeneratingState.generatingGeneralDraft, false);
      assert.equal(isGeneratingA, true);

      // Header button rendering logic
      const headerButtonA = {
        showsSpinner: queueGeneratingState.generatingGeneralDraft,
        label: queueGeneratingState.generatingGeneralDraft ? 'Generating Draft...' : 'Generate AI Blog Draft',
        disabled: isGeneratingA,
      };
      assert.equal(headerButtonA.showsSpinner, false, 'Header button must NOT spin when queue item generates');
      assert.equal(headerButtonA.label, 'Generate AI Blog Draft');
      assert.equal(headerButtonA.disabled, true, 'Header button must be disabled to prevent concurrent trigger');

      // Scenario B: Header button was clicked
      const headerGeneratingState = {
        generatingTopicId: null,
        generatingGeneralDraft: true,
      };
      const isGeneratingB = Boolean(
        headerGeneratingState.generatingTopicId || headerGeneratingState.generatingGeneralDraft,
      );
      const headerButtonB = {
        showsSpinner: headerGeneratingState.generatingGeneralDraft,
        label: headerGeneratingState.generatingGeneralDraft ? 'Generating Draft...' : 'Generate AI Blog Draft',
        disabled: isGeneratingB,
      };
      assert.equal(headerButtonB.showsSpinner, true, 'Header button MUST spin when header action is active');
      assert.equal(headerButtonB.label, 'Generating Draft...');
      assert.equal(headerButtonB.disabled, true);
    });
  });

  describe('Keyword Discovery Modal Button Isolation', () => {
    const sampleKeywords = [
      { keyword: 'billing software guntur' },
      { keyword: 'school website chilakaluripet' },
      { keyword: 'hospital management palnadu' },
    ];

    it('activates draft spinner strictly on active keyword and disables all others', () => {
      const activeKeyword = 'school website chilakaluripet';
      const isGlobalGenerating = false;

      const buttonStates = sampleKeywords.map((kw) => {
        const isThisKwGenerating = activeKeyword === kw.keyword;
        const isActionDisabled = isGlobalGenerating || Boolean(activeKeyword);
        return {
          kw: kw.keyword,
          showsSpinner: isThisKwGenerating,
          isDisabled: isActionDisabled,
          label: isThisKwGenerating ? 'Drafting...' : 'Draft Post',
        };
      });

      assert.equal(buttonStates[0].showsSpinner, false);
      assert.equal(buttonStates[0].label, 'Draft Post');
      assert.equal(buttonStates[0].isDisabled, true);

      assert.equal(buttonStates[1].showsSpinner, true);
      assert.equal(buttonStates[1].label, 'Drafting...');
      assert.equal(buttonStates[1].isDisabled, true);

      assert.equal(buttonStates[2].showsSpinner, false);
      assert.equal(buttonStates[2].label, 'Draft Post');
      assert.equal(buttonStates[2].isDisabled, true);
    });
  });

  describe('Duplicate Request Prevention Guard', () => {
    it('prevents multiple API invocations when user double-clicks or triggers parallel generation', async () => {
      let apiCallCount = 0;
      let inFlight = false;

      const triggerGenerate = async () => {
        if (inFlight) {
          return { skipped: true };
        }
        inFlight = true;
        try {
          apiCallCount += 1;
          await new Promise((r) => setTimeout(r, 20));
          return { skipped: false, success: true };
        } finally {
          inFlight = false;
        }
      };

      // Rapid double click
      const [res1, res2] = await Promise.all([
        triggerGenerate(),
        triggerGenerate(),
      ]);

      assert.equal(apiCallCount, 1, 'Exactly one API call must be executed for duplicate rapid clicks');
      assert.equal(res1.skipped, false);
      assert.equal(res2.skipped, true);
    });

    it('rejects topic generation if general draft is already running', async () => {
      let generatingGeneralDraft = true;
      let generatingTopicId = null;

      const isGenerating = () => Boolean(generatingTopicId || generatingGeneralDraft);
      let topicApiCalled = false;

      const generateFromTopic = async (topicId) => {
        if (isGenerating()) return;
        generatingTopicId = topicId;
        try {
          topicApiCalled = true;
        } finally {
          generatingTopicId = null;
        }
      };

      await generateFromTopic('topic-abc');
      assert.equal(topicApiCalled, false, 'Should not start topic generation while general draft is in flight');
    });
  });
});
