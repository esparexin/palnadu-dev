import React from 'react';
import Component from '@/components/ui/stacking-card';

const projects = [
  {
    title: 'Matthias Leidinger',
    description:
      'Originally hailing from Austria, Berlin-based photographer Matthias Leindinger is a young creative brimming with talent and ideas.',
    link: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    color: '#5196fd',
  },
  {
    title: 'Clément Chapillon',
    description:
      'This is a story on the border between reality and imaginary, about the contradictory feelings that the insularity of a rocky, arid, and wild territory provokes”—so French photographer Clément.',
    link: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    color: '#8f89ff',
  },
  {
    title: 'Zissou',
    description:
      'Though he views photography as a medium for storytelling, Zissou’s images don’t insist on a narrative. Both crisp and ethereal.',
    link: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    color: '#13006c',
  },
  {
    title: 'Mathias Svold and Ulrik Hasemann',
    description:
      'The coastlines of Denmark are documented in tonal colors in a pensive new series by Danish photographers Ulrik Hasemann and Mathias Svold; an ongoing project investigating how humans interact with and disrupt the Danish coast.',
    link: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    color: '#ed649e',
  },
  {
    title: 'Mark Rammers',
    description:
      'Dutch photographer Mark Rammers has shared with IGNANT the first chapter of his latest photographic project, ‘all over again’—captured while in residency at Hektor, an old farm in Los Valles, Lanzarote.',
    link: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    color: '#fd521a',
  },
];

function ComponentDemo() {
  return (
    <Component projects={projects} />
  );
}

export { ComponentDemo as DemoOne };
export default ComponentDemo;
