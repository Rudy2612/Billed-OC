/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import Bills from "../containers/Bills"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";




jest.mock("../app/store", () => mockStore);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {

  describe("When I am on Bills Page", () => {


    /*
      Ce test vérifie que l'icone dans le menu est en surbrillance
      Ajout du expect pour que le test fonctionne.
    */
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Verification que l'icône contient la bonne classe
      expect(windowIcon.className).toBe('active-icon')
    })


    /*
      Ce test vérifie que les factures soit ordonnés par date.
      Ajout d'une instruction dans view/BuillsUI.js pour trier les factures.
    */
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    /*
      Ce test valide qu'il est possible d'aller sur la page de création de facture via le bouton prévu à cet effet.
    */
    test("Then it is possible to go to the page of the new bill", async () => {
      // Génération de la page Bill
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Click sur le bouton pour etre redirigé vers la page de création de note de frais
      const windowIcon = screen.getByTestId('btn-new-bill')
      windowIcon.click();

      // Verification grâce à l'url de la page actuellement affiché
      expect(window.location.toString()).toBe("http://localhost/#employee/bill/new")
    })


    /*
      Ce test valide l'ouverture du modal d'affichage de fichier à joindre à une note de frais
    */
    test("Then, it is possible to open a modal to view the file attached to an invoice", async () => {
      // Simulation de la fonction modal de JQuery.
      $.fn.modal = jest.fn();

      // Génération de la page Bill
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills });

      // Instanciation des fonctionnalités du container Bills.
      const bill = new Bills({
        document,
        onNavigate,
        localStorage: localStorageMock,
        store: null,
      });

      // Création d'un espion de la fonction d'ouverture du modal
      jest.spyOn(bill, "handleClickIconEye");

      // Clic chaque icône présente sur la page qui devrait déclancher l'ouverture de la modale du fichier.
      const EyeIcons = screen.getAllByTestId('icon-eye')
      EyeIcons.forEach((e) => {
        e.click();
      })


      // Verification la function d'affichage a été appelé autant de fois qu'il y a de facture (et donc de clics). 
      expect(bill.handleClickIconEye).toHaveBeenCalledTimes(EyeIcons.length);
    })

  })


  /*    
  ––––––––––––––––––––––––––––
  * TEST D'INTEGRATION API GET
  ––––––––––––––––––––––––––––
  */




  /*
    Ce test valide l'affichage des bills sur la page (GET API)
  */
  describe("When I navigate to Bills", () => {

    beforeAll(() => {
      jest.spyOn(mockStore, "bills")
    })


    test("Then I can fetch bills from the GET mock API", async () => {
      // Génération de la page Bill
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Attente jusqu'à l'affichage de la page (via le titre)
      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Verification que la page est bien affiché et qu'il ne s'agit pas d'une page d'erreur
      expect(screen.getByTestId("tbody")).toBeTruthy();
    })


    /*
      Ce test vérifie l'affichage d'une erreur 404 sur la page des fctures
    */
    test("Then the API returns me a 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills);

      // Attente de la prochaine itération pour continuer l'execution
      await new Promise(process.nextTick);

      const message = await waitFor(() => screen.getByText(/Erreur 404/));
      expect(message).toBeTruthy();
    })

    /*
      Ce test vérifie l'affichage d'une erreur 500 sur la page des fctures
    */
    test("Then the API returns me a 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills);

      // Attente de la prochaine itération pour continuer l'execution
      await new Promise(process.nextTick);

      const message = await waitFor(() => screen.getByText(/Erreur 500/));
      expect(message).toBeTruthy();
    })

  })
})
