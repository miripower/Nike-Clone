describe('Añadir nuevo producto como administrador', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
    cy.log('Página de login cargada');

    cy.get('input[formControlName="email"]').type('polmivi@gmail.com');
    cy.get('input[formControlName="password"]').type('monlau2025');
    cy.get('button[type="submit"]').click();

    cy.log('Inicio de sesión realizado');
    cy.visit('http://localhost:4200/admin');
    cy.log('Página de admin cargada');
  });
  
  it('debería añadir un nuevo producto correctamente', () => {
    // Rellenar el formulario
    cy.get('input[formControlName="ReferenceNumber"]').clear().type('100');
    cy.get('input[formControlName="Name"]').clear().type('Producto Test Cypress');
    cy.get('textarea[formControlName="Description"]').clear().type('Este es un producto de prueba generado por Cypress');
    cy.get('input[formControlName="Price"]').clear().type('199.99');
    cy.get('select[formControlName="Type"]').select('Zapatillas');
    cy.get('input[formControlName="OnSale"]').check();
    cy.get('input[formControlName="Stock"]').clear().type('15');
    const imagePath = 'images/test-cypress.png';
    cy.get('input[type="file"]').selectFile(`cypress/fixtures/${imagePath}`, { force: true });

    cy.get('form').submit();

    cy.contains('Producto agregado con éxito').should('be.visible');
  });
});
