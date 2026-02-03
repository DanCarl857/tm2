describe('dashboard e2e', () => {
  it('loads login without auth', () => {
    cy.visit('/login');
    cy.contains('Login');
  });

  it('logs in and creates a task', () => {
    cy.visit('/login');
    cy.get('input').first().clear().type('owner@demo.com');
    cy.get('input[type="password"]').clear().type('password123');
    cy.contains('Sign in').click();

    cy.contains('Task Manager');
    cy.contains('New').click();
    cy.contains('New Task');
  });

  it('toggles theme with keyboard shortcut', () => {
    cy.visit('/login');
    cy.get('input').first().clear().type('owner@demo.com');
    cy.get('input[type="password"]').clear().type('password123');
    cy.contains('Sign in').click();

    cy.get('body').type('d');
    cy.get('html').should('have.class', 'dark');
    cy.get('body').type('d');
    cy.get('html').should('not.have.class', 'dark');
  });

  it('search shortcut focuses search', () => {
    cy.visit('/login');
    cy.get('input').first().clear().type('owner@demo.com');
    cy.get('input[type="password"]').clear().type('password123');
    cy.contains('Sign in').click();

    cy.get('body').type('/');
    cy.get('#search').should('be.focused');
  });
});
