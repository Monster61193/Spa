import { test, expect } from '@playwright/test'

test.describe('Workspace Demo', () => {
  test('cambia sucursal y refleja citas/inventario', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Agenda Cinco Estrellas' })).toBeVisible()
    await expect(page.getByText('Sucursal activa')).toBeVisible()

    const select = page.locator('#branch-select')
    await select.selectOption('branch-norte')
    await expect(page.getByText('Sucursal activa: Norte')).toBeVisible()

    await expect(page.getByRole('cell', { name: 'Pedicure spa' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Modelo de inventario' })).toBeVisible()
  })
})
