/**
 * @jest-environment jsdom
 *
 * Sprint 6: jsdom evaluation for React component rendering tests.
 * This file verifies that jsdom can render React components
 * without error in the current test configuration.
 *
 * Note: The project does not configure a JSX transform in Jest,
 * so this test uses React.createElement to avoid parser errors.
 * Full JSX rendering support would require adding @babel/preset-react.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { render, screen } from '@testing-library/react'

/**
 * Simple pure component for environment verification.
 * Uses React.createElement instead of JSX syntax.
 */
function TestBadge({ label, colour }) {
  return React.createElement('span', {
    className: 'test-badge',
    style: { backgroundColor: colour },
    'data-testid': 'badge'
  }, label)
}

TestBadge.propTypes = {
  label: PropTypes.string.isRequired,
  colour: PropTypes.string.isRequired
}

describe('jsdom Environment Evaluation', () => {
  test('jsdom provides a document', () => {
    expect(typeof document).toBe('object')
    expect(document.body).toBeDefined()
  })

  test('React component renders without error', () => {
    const { container } = render(
      React.createElement(TestBadge, { label: 'Online', colour: '#28a745' })
    )

    expect(container.querySelector('.test-badge')).toBeTruthy()
  })

  test('Rendered content is accessible via Testing Library', () => {
    render(
      React.createElement(TestBadge, { label: 'Offline', colour: '#dc3545' })
    )

    const badge = screen.getByTestId('badge')
    expect(badge.textContent).toBe('Offline')
    expect(badge.style.backgroundColor).toBe('rgb(220, 53, 69)')
  })

  test('multiple components can render in sequence', () => {
    const { unmount } = render(
      React.createElement(TestBadge, { label: 'First', colour: '#000' })
    )
    expect(screen.getByTestId('badge').textContent).toBe('First')

    unmount()

    render(
      React.createElement(TestBadge, { label: 'Second', colour: '#fff' })
    )
    expect(screen.getByTestId('badge').textContent).toBe('Second')
  })
})
